/**
 * @file
 * Contains DnDUploadAbstract class.
 */

/**
 * DnDUploadAbstract class.
 *
 * Attaches events' callbacks to droppables to make them work properly.
 */
var DnDUploadAbstract = function () {
  throw new Error('It is disallowed to instantiate this class! Extend it at first.');
};

(function ($) {
  DnDUploadAbstract.prototype = {
    dnd: null,
    processed: {},

    /**
     * Attach events to the given droppable areas.
     *
     * @param {jQuery} $droppables
     */
    attachEvents: function ($droppables) {
      var me = this;

      $.each(me.eventsList.dnd, function (name, func) {
        $droppables.bind(name, func.bind(me));
      });
    },

    /**
     * Detach events from the given droppable areas.
     *
     * @param {jQuery|undefined} $droppables
     */
    detachEvents: function ($droppables) {
      var me = this;

      $.each(me.eventsList.dnd, function (name) {
        $droppables.unbind(name);
      });
    },

    /**
     * Add droppable area.
     *
     * @param {string|jQuery} droppable
     */
    addDroppable: function (droppable) {
      var $droppable = $(droppable);
      this.dnd.addDroppable($droppable);

      this.attachEvents($droppable);
    },

    /**
     * Remove droppable area.
     *
     * @param {string|jQuery} droppable
     */
    removeDroppable: function (droppable) {
      var $droppable = $(droppable);
      this.detachEvents($droppable);

      this.dnd.removeDroppable($droppable);

    },

    /**
     * Set the given event callback as processed.
     *
     * @param {String} name
     */
    setProcessed: function (name) {
      this.processed[name] = true;
    },

    /**
     * Check whether the given event callback is already processed.
     *
     * @param {String} name
     */
    isProcessed: function (name) {
      this.processed[name] = true;
    },

    /**
     * Clear the processed event callbacks stack.
     */
    clearProcessed: function () {
      var me = this;
      $.each(me.processed, function (name) {
        me.processed[name] = false;
      });
    },

    /**
     * Get a prototype of this class.
     *
     * This method will be used in child classes to call parent methods.
     */
    parent: function () {
      return DnDUploadAbstract.prototype;
    },

    /**
     * Event callback that will be binded to the droppable areas.
     */
    eventsList: {
      /**
       * Droppable events.
       */
      dnd: {}
    }
  };

})(jQuery);
;
/**
 * @file
 * Contains DnDUpload class.
 */

/**
 * DnDUpload class.
 *
 * Attaches events callback to make Drupal form element 'dragndrop_upload'
 * work properly.
 *
 * @param {jQuery} $droppable
 */
var DnDUpload = function ($droppable) {
  this.dnd = $droppable.DnD();
  if (!this.dnd) {
    throw new Error('The $droppable does not contain an instance of DnD!');
  }

  this.$droppable = $droppable;
  this.dnd.$droppables.data('DnDUpload', this);

  this.attachEvents(this.dnd.$droppables);
};

(function ($) {
  DnDUpload.prototype = $.extend({}, DnDUploadAbstract.prototype, {
    /**
     * Attach events to the given droppable areas.
     *
     * @param {jQuery} $droppables
     */
    attachEvents: function ($droppables) {
      var me = this;
      var settings = me.dnd.settings;

      // Unbind default event callbacks.
      $droppables.unbind('dnd:showErrors');
      $droppables.unbind('dnd:send:options');
      $droppables.unbind('dnd:addFiles:after');

      /**
       * Add handler for Browse button.
       */
      $(settings.browseButton).bind('click', me.eventsList.browseButtonClick.bind(me));

      var $uploadButton = $('#' + settings.uploadButton);
      // Unbind all mousedown handlers. This is needed to prevent default 
      // event handler to trigger Drupal.ajax request.
      $uploadButton.unbind('mousedown');

      // Bind fileButtons handlers again, because they were removed.
      $uploadButton.bind('mousedown', Drupal.file.disableFields);
      $uploadButton.bind('mousedown', Drupal.file.progressBar);

      // This handler must be binded after File module handlers because 
      // 'progressBar' handler adds UPLOAD_IDENTIFIER hidden input
      $uploadButton.bind('mousedown', me.eventsList.uploadBtnMousedown.bind(me));

      /**
       * Attach the change event to the file input element to track and add
       * to the droppable area files added by the Browse button.
       */
        
      // TODO: test in IE 11. Check if jQuery v.1.5 has already resolved the issue.
      var changeEvent = 'change';
      // IE 10 does not support 'change' event on input file elements.
      if ($.browser.msie && $.browser.version <= 10) {
        changeEvent = 'input';
      }
      $('input[name="' + settings.name + '"]').unbind(changeEvent)
        .bind(changeEvent, me.eventsList.inputFileChange.bind(me));

      me.parent().attachEvents.call(me, $droppables);
    },

    /**
     * Detach events from the given droppable areas.
     *
     * @param {jQuery|undefined} $droppables
     */
    detachEvents: function ($droppables) {
      var me = this;
      var settings = me.dnd.settings;

      me.parent().detachEvents.call(me, $droppables);
      $('#' + settings.uploadButton).unbind('mousedown');
      $(settings.browseButton).unbind('click');
      $('input[name="' + settings.name + '"]').unbind('change');
    },

    /**
     * Event callback that will be binded to the droppable areas.
     */
    eventsList: {
      /**
       * Droppable events.
       */
      dnd: {
        /**
         * Event callback for dnd:send:options
         *
         * Appends the necessary data to the FormData object, alters ajax
         * options to add Drupal ajax support for element.
         *
         * @param event
         * @param options
         * @param {DnDFormData} dndFormData
         */
        'dnd:send:options': function (event, options, dndFormData) {
          // Do not call the callback for every droppable area, call it just once.
          if (this.isProcessed(event.type)) {
            return;
          }
          this.setProcessed(event.type);

          var me = this;
          var settings = this.dnd.settings;
          var $formEl = $(settings.selector).closest('form');

          /**
           * Add all input elements to the FormData.
           * Do not include submits and buttons as it will mess up a
           * 'triggering element' of the FormData.
           *
           * Also do not add file input element as it is empty.
           */
          var not = ['type="submit"', 'type="button"', 'name="' + settings.name + '"'];
          $('input:not([' + not.join(']):not([') + ']),select,textarea', $formEl).each(function (i, el) {
            var $el = $(el), name = $el.attr('name');
            // Some form elements do not contain "name" attribute. 
            if (name) {
              // Upload identifier must be put before files.
              // @see https://bugs.php.net/bug.php?id=57505
              var upId = name.match(/^(?:APC_UPLOAD_PROGRESS|UPLOAD_IDENTIFIER)$/);
              if (upId) {
                dndFormData.prepend(upId[0], $el.val());
              }
              else {
                dndFormData.append(name, $el.val());
              }
            }
          });

          // Alter options to add Drupal ajax options.
          var ajax = Drupal.ajax[me.dnd.settings.uploadButton];
          var drupalAjaxOptions = $.extend({}, ajax.options);
          options = $.extend(options, drupalAjaxOptions, {
            data: null,
            beforeSend: function (xmlhttprequest, options) {
              options.data = drupalAjaxOptions.data;

              // Call standard Drupal ajax methods.
              drupalAjaxOptions.beforeSerialize(me.dnd.$droppables, options);
              drupalAjaxOptions.beforeSend(xmlhttprequest, options);

              // Put elements from options.data into the DnDFormData.
              dndFormData.multiAppend(options.data);
            }
          });
        },

        /**
         * Event callback for the 'dnd:addFiles:before' event.
         *
         * Removes old error messages.
         */
        'dnd:addFiles:before': function () {
          var settings = this.dnd.settings;
          var $element = $(settings.selector).parent();
          $('>.messages.error', $element).remove();

          // Allow new file to replace existing one when cardinality equals 1
          // and 'Allow replacing of existing file' setting is turned on.
          var filesList = this.dnd.getFilesList();
          if (settings.cardinality == 1) {
            if (filesList.length && settings.allowReplace) {
              this.dnd.removeFile(filesList[0]);
            }
          }
        },

        /**
         * Event callback for the 'dnd:addFiles:after' event.
         */
        'dnd:addFiles:after': function () {
          var settings = this.dnd.settings;
          var $uploadButton = $('#' + settings.uploadButton);

          if (this.dnd.settings.uploadEvent == 'auto') {
            $uploadButton.trigger('mousedown');
          }
          else {
            var $droppableMsg = $('.droppable-message', this.$droppable);

            // Hide preview message if files number has reached the cardinality.
            if (settings.cardinality != -1) {
              if (settings.cardinality <= this.dnd.getFilesList().length) {
                if (settings.cardinality != 1 || !settings.allowReplace) {
                  $droppableMsg.hide();
                }
              }
            }

            $uploadButton.show();
          }
        },

        /**
         * Error callback.
         *
         * @param event
         * @param {Array} errors
         */
        'dnd:showErrors': function (event, errors) {
          // Do not call the callback for every droppable area, call it just once.
          if (this.isProcessed(event.type)) {
            return;
          }
          this.setProcessed(event.type);

          var settings = this.dnd.settings;
          var messages = [];

          // Go through the errors array and create human-readable messages.
          $.each(errors, function (i, error) {
            if (!settings.errorsInfo[error.type]) {
              error.type = 'unknown';
            }
            messages.push(Drupal.t(settings.errorsInfo[error.type], error.args));
          });

          var $element = $(settings.selector).parent();
          $('>.messages.error', $element).remove();
          $element.prepend('<div class="messages error file-upload-js-error">' + messages.join('<br/>') + '</div>');
        },

        'dnd:send:complete, dnd:removeFile:empty': function () {
          var settings = this.dnd.settings;
          var $uploadButton = $('#' + settings.uploadButton);
          var $droppableMsg = $('.droppable-message', this.$droppable);

          if (settings.uploadEvent == 'manual' && !this.dnd.sending) {
            $uploadButton.hide();
            $droppableMsg.show();
          }
        },

        'dnd:createPreview': function (dndFile) {
          var fileSize = dndFile.file.size;
          var sizes = [Drupal.t('@size B'), Drupal.t('@size KB'), Drupal.t('@size MB'), Drupal.t('@size GB')];
          $.each(sizes, function (i, size) {
            if (fileSize > 1024) {
              fileSize /= 1024;
            }
            else {
              fileSize = sizes[i].replace('@size', Number(fileSize.toPrecision(2)));
              return false;
            }
            return true;
          });

          var me = this;
          var $previewCnt = $('.droppable-preview', dndFile.$droppable);
          var $preview = dndFile.$preview = $('.droppable-preview-file', $previewCnt).last();
          $preview.data('dndFile', dndFile);

          $previewCnt.append($preview.clone());

          $('.preview-filename', $preview).html(dndFile.file.name);
          $('.preview-filesize', $preview).html(fileSize);
          $('.preview-remove', $preview).bind('click', function () {
            me.dnd.removeFile(dndFile);
          });

          $preview.fadeIn();
        },

        'dnd:removePreview': function (event, dndFile) {
          /**
           * Do not remove preview while sending files, instead remove it when
           * the sending is finished in order not to confuse user.
           */
          if (this.dnd.sending) {
            dndFile.$droppable.one('dnd:send:complete', function () {
              dndFile.$preview.remove();
            });
          }
          // Otherwise, just remove preview.
          else {
            dndFile.$preview.remove();
          }
        },

        /**
         * Detach events before the droppable area will be destroyed.
         *
         * @param event
         * @param $droppable
         */
        'dnd:destroy:before': function (event, $droppable) {
          this.detachEvents($droppable);
          $droppable.removeClass('dnd-upload-element-processed');
        }
      },

      /**
       * Event callback for the Upload button.
       */
      uploadBtnMousedown: function (event) {
        event.preventDefault();
        event.stopPropagation();

        this.dnd.send();
        return false;
      },

      /**
       * Event callback for the Browse button.
       */
      browseButtonClick: function (event) {
        event.preventDefault();

        this.dnd.$activeDroppable = this.$droppable;
        $('input[name="' + this.dnd.settings.name + '"]').click();

        return false;
      },

      /**
       * Event callback for the file input element to handle uploading.
       */
      inputFileChange: function (event) {
        // Clone files array before clearing the input element.
        var transFiles = $.extend({}, event.target.files);
        // Clear the input element before adding files to the droppable area,
        // because if auto uploading is enabled, files are sent twice - from
        // the input element and the droppable area.
        $(event.target).val('');

        this.dnd.addFiles(this.dnd.$activeDroppable, transFiles);
      }
    }
  });

})(jQuery);
;
/**
 * @file
 * Contains a behavior to initialize dragndrop_upload element.
 */

(function ($) {
  Drupal.behaviors.dragndropUploadElement = {
    attach: function (context, settings) {
      if (!settings.dragndropUploadElement) {
        return;
      }
      $.each(settings.dragndropUploadElement, function (selector) {
        $(selector, context).once('dnd-upload-element', function () {
          new DnDUpload($(this));
        });
      });
    }
  };
})(jQuery);
;

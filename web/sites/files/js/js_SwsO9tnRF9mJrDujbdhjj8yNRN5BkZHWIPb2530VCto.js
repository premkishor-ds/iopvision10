(function ($) {

/**
 * Attaches sticky table headers.
 */
Drupal.behaviors.tableHeader = {
  attach: function (context, settings) {
    if (!$.support.positionFixed) {
      return;
    }

    $('table.sticky-enabled', context).once('tableheader', function () {
      $(this).data("drupal-tableheader", new Drupal.tableHeader(this));
    });
  }
};

/**
 * Constructor for the tableHeader object. Provides sticky table headers.
 *
 * @param table
 *   DOM object for the table to add a sticky header to.
 */
Drupal.tableHeader = function (table) {
  var self = this;

  this.originalTable = $(table);
  this.originalHeader = $(table).children('thead');
  this.originalHeaderCells = this.originalHeader.find('> tr > th');
  this.displayWeight = null;

  // React to columns change to avoid making checks in the scroll callback.
  this.originalTable.bind('columnschange', function (e, display) {
    // This will force header size to be calculated on scroll.
    self.widthCalculated = (self.displayWeight !== null && self.displayWeight === display);
    self.displayWeight = display;
  });

  // Clone the table header so it inherits original jQuery properties. Hide
  // the table to avoid a flash of the header clone upon page load.
  this.stickyTable = $('<table class="sticky-header"/>')
    .insertBefore(this.originalTable)
    .css({ position: 'fixed', top: '0px' });
  this.stickyHeader = this.originalHeader.clone(true)
    .hide()
    .appendTo(this.stickyTable);
  this.stickyHeaderCells = this.stickyHeader.find('> tr > th');

  this.originalTable.addClass('sticky-table');
  $(window)
    .bind('scroll.drupal-tableheader', $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    .bind('resize.drupal-tableheader', { calculateWidth: true }, $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    // Make sure the anchor being scrolled into view is not hidden beneath the
    // sticky table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceAnchor.drupal-tableheader', function () {
      window.scrollBy(0, -self.stickyTable.outerHeight());
    })
    // Make sure the element being focused is not hidden beneath the sticky
    // table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceFocus.drupal-tableheader', function (event) {
      if (self.stickyVisible && event.clientY < (self.stickyOffsetTop + self.stickyTable.outerHeight()) && event.$target.closest('sticky-header').length === 0) {
        window.scrollBy(0, -self.stickyTable.outerHeight());
      }
    })
    .triggerHandler('resize.drupal-tableheader');

  // We hid the header to avoid it showing up erroneously on page load;
  // we need to unhide it now so that it will show up when expected.
  this.stickyHeader.show();
};

/**
 * Event handler: recalculates position of the sticky table header.
 *
 * @param event
 *   Event being triggered.
 */
Drupal.tableHeader.prototype.eventhandlerRecalculateStickyHeader = function (event) {
  var self = this;
  var calculateWidth = event.data && event.data.calculateWidth;

  // Reset top position of sticky table headers to the current top offset.
  this.stickyOffsetTop = Drupal.settings.tableHeaderOffset ? eval(Drupal.settings.tableHeaderOffset + '()') : 0;
  this.stickyTable.css('top', this.stickyOffsetTop + 'px');

  // Save positioning data.
  var viewHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  if (calculateWidth || this.viewHeight !== viewHeight) {
    this.viewHeight = viewHeight;
    this.vPosition = this.originalTable.offset().top - 4 - this.stickyOffsetTop;
    this.hPosition = this.originalTable.offset().left;
    this.vLength = this.originalTable[0].clientHeight - 100;
    calculateWidth = true;
  }

  // Track horizontal positioning relative to the viewport and set visibility.
  var hScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  var vOffset = (document.documentElement.scrollTop || document.body.scrollTop) - this.vPosition;
  this.stickyVisible = vOffset > 0 && vOffset < this.vLength;
  this.stickyTable.css({ left: (-hScroll + this.hPosition) + 'px', visibility: this.stickyVisible ? 'visible' : 'hidden' });

  // Only perform expensive calculations if the sticky header is actually
  // visible or when forced.
  if (this.stickyVisible && (calculateWidth || !this.widthCalculated)) {
    this.widthCalculated = true;
    var $that = null;
    var $stickyCell = null;
    var display = null;
    var cellWidth = null;
    // Resize header and its cell widths.
    // Only apply width to visible table cells. This prevents the header from
    // displaying incorrectly when the sticky header is no longer visible.
    for (var i = 0, il = this.originalHeaderCells.length; i < il; i += 1) {
      $that = $(this.originalHeaderCells[i]);
      $stickyCell = this.stickyHeaderCells.eq($that.index());
      display = $that.css('display');
      if (display !== 'none') {
        cellWidth = $that.css('width');
        // Exception for IE7.
        if (cellWidth === 'auto') {
          cellWidth = $that[0].clientWidth + 'px';
        }
        $stickyCell.css({'width': cellWidth, 'display': display});
      }
      else {
        $stickyCell.css('display', 'none');
      }
    }
    this.stickyTable.css('width', this.originalTable.outerWidth());
  }
};

})(jQuery);
;
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
/**
 * @file
 * Contains DnDUploadFile class.
 */

/**
 * DnDUploadFile class.
 *
 * Attaches events callback to make widget 'dragndrop_upload_file'
 * work properly.
 *
 * @param {jQuery} $droppable
 */
var DnDUploadFile = function ($droppable) {
  this.dnd = $droppable.DnD();
  if (!this.dnd) {
    throw new Error('The $droppable does not contain an instance of DnD!');
  }

  this.$droppable = $droppable;
  this.dnd.$droppables.data('DnDUploadFile', this);

  this.attachEvents(this.dnd.$droppables);
};

(function ($) {
  DnDUploadFile.prototype = $.extend(true, {}, DnDUploadAbstract.prototype, {
    /**
     * Event callback that will be binded to the droppable areas.
     */
    eventsList: {
      /**
       * Droppable events.
       */
      dnd: {
        /**
         * Detach events before the droppable area will be destroyed.
         *
         * @param event
         * @param $droppable
         */
        'dnd:destroy:before': function (event, $droppable) {
          $droppable.removeClass('dnd-upload-file-processed');
        }
      }
    }
  });
})(jQuery);
;
/**
 * @file
 * Contains a behavior-function to initialize dragndrop_upload_file widget.
 *
 * Settings are provided via Drupal.settings.dragndropUpload variable.
 */

(function ($) {
  Drupal.behaviors.dragndropUploadFile = {
    attach: function (context, settings) {
      if (!settings.dragndropUploadFile) {
        return;
      }

      $.each(settings.dragndropUploadFile, function (i, selector) {
        $(selector, context).once('dnd-upload-file', function () {
          new DnDUploadFile($(this));
        });
      });
    }
  };
})(jQuery);
;
/**
 * @file
 * Contains DnDUploadImage class.
 */

/**
 * DnDUploadImage class.
 *
 * Attaches events callback to make widget 'dragndrop_upload_image'
 * work properly.
 *
 * @param {jQuery} $droppable
 */
var DnDUploadImage = function ($droppable) {
  this.dnd = $droppable.DnD();
  if (!this.dnd) {
    throw new Error('The $droppable does not contain an instance of DnD!');
  }

  this.$droppable = $droppable;
  this.dnd.$droppables.data('DnDUploadImage', this);

  this.attachEvents(this.dnd.$droppables);
};

(function ($) {
  DnDUploadImage.prototype = $.extend(true, {}, DnDUploadFile.prototype, {
    /**
     * Attach events to the given droppable areas.
     *
     * @param {jQuery} $droppables
     */
    attachEvents: function ($droppables) {
      var me = this;

      me.parent().attachEvents.call(me, $droppables);

      // Unbind default createPreview event handler and add a new one.
      $droppables.unbind('dnd:createPreview').bind('dnd:createPreview', me.eventsList.dnd['dnd:createPreview'].bind(me));
    },
    
    /**
     * Event callback that will be binded to the droppable areas.
     */
    eventsList: {
      /**
       * Droppable events.
       */
      dnd: {
        'dnd:createPreview': function (dndFile, reader) {
          var DnD = this.dnd;
          // Or you can get DnD this way:
          // var DnD = dndFile.$droppable.data('DnD');
          var $previewCnt = $('.droppable-preview', dndFile.$droppable);
          var $preview = dndFile.$preview = $('.droppable-preview-image', $previewCnt).last();
          $preview.data('dndFile', dndFile);

          $previewCnt.append($preview.clone());

          $('img', $preview).attr('src', reader.result);

          $('.preview-remove', $preview).click(function () {
            DnD.removeFile(dndFile);
          });

          $preview.fadeIn();
        },

        /**
         * Detach events before the droppable area will be destroyed.
         *
         * @param event
         * @param $droppable
         */
        'dnd:destroy:before': function (event, $droppable) {
          $droppable.removeClass('dnd-upload-image-processed');
        }
      }
    }
  });
})(jQuery);
;
/**
 * @file
 * Contains a behavior-function to initialize dragndrop_upload_file widget.
 */

(function ($) {
  Drupal.behaviors.dragndropUploadImage = {
    attach: function (context, settings) {
      if (!settings.dragndropUploadImage) {
        return;
      }

      $.each(settings.dragndropUploadImage, function (i, selector) {
        $(selector, context).once('dnd-upload-image', function () {
          new DnDUploadImage($(this));
        });
      });
    }
  }
})(jQuery);
;

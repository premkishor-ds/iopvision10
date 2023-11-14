(function($) {

CKEDITOR.disableAutoInline = true;

// Exclude every id starting with 'cke_' in ajax_html_ids during AJAX requests.
Drupal.wysiwyg.excludeIdSelectors.wysiwyg_ckeditor = ['[id^="cke_"]'];

// Keeps track of private instance data.
var instanceMap;

/**
 * Initialize the editor library.
 *
 * This method is called once the first time a library is needed. If new
 * WYSIWYG fields are added later, update() will be called instead.
 *
 * @param settings
 *   An object containing editor settings for each input format.
 * @param pluginInfo
 *   An object containing global plugin configuration.
 */
Drupal.wysiwyg.editor.init.ckeditor = function(settings, pluginInfo) {
  instanceMap = {};
  // Nothing to do here other than register new plugins etc.
  Drupal.wysiwyg.editor.update.ckeditor(settings, pluginInfo);
};

/**
 * Update the editor library when new settings are available.
 *
 * This method is called instead of init() when at least one new WYSIWYG field
 * has been added to the document and the library has already been initialized.
 *
 * $param settings
 *   An object containing editor settings for each input format.
 * $param pluginInfo
 *   An object containing global plugin configuration.
 */
Drupal.wysiwyg.editor.update.ckeditor = function(settings, pluginInfo) {
  // Register native external plugins.
  // Array syntax required; 'native' is a predefined token in JavaScript.
  for (var pluginId in pluginInfo['native']) {
    if (pluginInfo['native'].hasOwnProperty(pluginId) && (!CKEDITOR.plugins.externals || !CKEDITOR.plugins.externals[pluginId])) {
      var plugin = pluginInfo['native'][pluginId];
      CKEDITOR.plugins.addExternal(pluginId, plugin.path, plugin.fileName);
    }
  }
  // Build and register Drupal plugin wrappers.
  for (var pluginId in pluginInfo.drupal) {
    if (pluginInfo.drupal.hasOwnProperty(pluginId) && (!CKEDITOR.plugins.registered || !CKEDITOR.plugins.registered[pluginId])) {
      Drupal.wysiwyg.editor.instance.ckeditor.addPlugin(pluginId, pluginInfo.drupal[pluginId]);
    }
  }
  // Register Font styles (versions 3.2.1 and above).
  for (var format in settings) {
    if (settings[format].stylesSet && (!CKEDITOR.stylesSet || !CKEDITOR.stylesSet.registered[format])) {
      CKEDITOR.stylesSet.add(format, settings[format].stylesSet);
    }
  }
};

/**
 * Attach this editor to a target element.
 */
Drupal.wysiwyg.editor.attach.ckeditor = function(context, params, settings) {
  // Apply editor instance settings.
  CKEDITOR.config.customConfig = '';

  var $drupalToolbars = $('#toolbar, #admin-menu', Drupal.overlayChild ? window.parent.document : document);
  if (!settings.height) {
    settings.height = $('#' + params.field).height();
  }
  settings.on = {
    instanceReady: function(ev) {
      var editor = ev.editor;
      // Get a list of block, list and table tags from CKEditor's XHTML DTD.
      // @see http://docs.cksource.com/CKEditor_3.x/Developers_Guide/Output_Formatting.
      var dtd = CKEDITOR.dtd;
      var tags = CKEDITOR.tools.extend({}, dtd.$block, dtd.$listItem, dtd.$tableContent);
      // Set source formatting rules for each listed tag except <pre>.
      // Linebreaks can be inserted before or after opening and closing tags.
      if (settings.simple_source_formatting) {
        // Mimic FCKeditor output, by breaking lines between tags.
        for (var tag in tags) {
          if (tag == 'pre') {
            continue;
          }
          this.dataProcessor.writer.setRules(tag, {
            indent: true,
            breakBeforeOpen: true,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: true
          });
        }
      }
      else {
        // CKEditor adds default formatting to <br>, so we want to remove that
        // here too.
        tags.br = 1;
        // No indents or linebreaks;
        for (var tag in tags) {
          if (tag == 'pre') {
            continue;
          }
          this.dataProcessor.writer.setRules(tag, {
            indent: false,
            breakBeforeOpen: false,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: false
          });
        }
      }
    },

    pluginsLoaded: function(ev) {
      var wysiwygInstance = instanceMap[this.name];
      var enabledPlugins = wysiwygInstance.pluginInfo.instances.drupal;
      // Override the conversion methods to let Drupal plugins modify the data.
      var editor = ev.editor;
      if (editor.dataProcessor && enabledPlugins) {
        editor.dataProcessor.toHtml = CKEDITOR.tools.override(editor.dataProcessor.toHtml, function(originalToHtml) {
          // Convert raw data for display in WYSIWYG mode.
          return function(data, fixForBody) {
            for (var plugin in enabledPlugins) {
              if (typeof Drupal.wysiwyg.plugins[plugin].attach == 'function') {
                data = Drupal.wysiwyg.plugins[plugin].attach(data, wysiwygInstance.pluginInfo.global.drupal[plugin], editor.name);
                data = wysiwygInstance.prepareContent(data);
              }
            }
            return originalToHtml.call(this, data, fixForBody);
          };
        });
        editor.dataProcessor.toDataFormat = CKEDITOR.tools.override(editor.dataProcessor.toDataFormat, function(originalToDataFormat) {
          // Convert WYSIWYG mode content to raw data.
          return function(data, fixForBody) {
            data = originalToDataFormat.call(this, data, fixForBody);
            for (var plugin in enabledPlugins) {
              if (typeof Drupal.wysiwyg.plugins[plugin].detach == 'function') {
                data = Drupal.wysiwyg.plugins[plugin].detach(data, wysiwygInstance.pluginInfo.global.drupal[plugin], editor.name);
              }
            }
            return data;
          };
        });
      }
    },

    selectionChange: function (event) {
      var wysiwygInstance = instanceMap[this.name];
      var enabledPlugins = wysiwygInstance.pluginInfo.instances.drupal;
      for (var name in enabledPlugins) {
        var plugin = Drupal.wysiwyg.plugins[name];
        if ($.isFunction(plugin.isNode)) {
          var node = event.data.selection.getSelectedElement();
          var state = plugin.isNode(node ? node.$ : null) ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF;
          event.editor.getCommand(name).setState(state);
        }
      }
    },

    focus: function(ev) {
      Drupal.wysiwyg.activeId = ev.editor.name;
    },

    afterCommandExec: function(ev) {
      // Fix Drupal toolbar obscuring editor toolbar in fullscreen mode.
      if (ev.data.name != 'maximize') {
        return;
      }
      if (ev.data.command.state == CKEDITOR.TRISTATE_ON) {
        $drupalToolbars.hide();
      }
      else {
        $drupalToolbars.show();
      }
    },

    destroy: function (event) {
      // Free our reference to the private instance to not risk memory leaks.
      delete instanceMap[this.name];
    }
  };
  instanceMap[params.field] = this;
  // Attach editor.
  var editorInstance = CKEDITOR.replace(params.field, settings);
};

/**
 * Detach a single editor instance.
 */
Drupal.wysiwyg.editor.detach.ckeditor = function (context, params, trigger) {
  var method = (trigger == 'serialize') ? 'updateElement' : 'destroy';
  var instance = CKEDITOR.instances[params.field];
  if (!instance) {
    return;
  }
  instance[method]();
};

Drupal.wysiwyg.editor.instance.ckeditor = {
  addPlugin: function (pluginName, pluginSettings) {
    CKEDITOR.plugins.add(pluginName, {
      // Wrap Drupal plugin in a proxy plugin.
      init: function(editor) {
        if (pluginSettings.css) {
          editor.on('mode', function(ev) {
            if (ev.editor.mode == 'wysiwyg') {
              // Inject CSS files directly into the editing area head tag.
              var iframe = $('#cke_contents_' + ev.editor.name + ' iframe, #' + ev.editor.id + '_contents iframe');
              $('head', iframe.eq(0).contents()).append('<link rel="stylesheet" href="' + pluginSettings.css + '" type="text/css" >');
            }
          });
        }
        if (typeof Drupal.wysiwyg.plugins[pluginName].invoke == 'function') {
          var pluginCommand = {
            exec: function (editor) {
              var data = { format: 'html', node: null, content: '' };
              var selection = editor.getSelection();
              if (selection) {
                data.node = selection.getSelectedElement();
                if (data.node) {
                  data.node = data.node.$;
                }
                if (selection.getType() == CKEDITOR.SELECTION_TEXT) {
                  if (selection.getSelectedText) {
                    data.content = selection.getSelectedText();
                  }
                  else {
                    // Pre v3.6.1.
                    if (CKEDITOR.env.ie) {
                      data.content = selection.getNative().createRange().text;
                    }
                    else {
                      data.content = selection.getNative().toString();
                    }
                  }
                }
                else if (data.node) {
                  // content is supposed to contain the "outerHTML".
                  data.content = data.node.parentNode.innerHTML;
                }
              }
              Drupal.wysiwyg.plugins[pluginName].invoke(data, pluginSettings, editor.name);
            }
          };
          editor.addCommand(pluginName, pluginCommand);
        }
        editor.ui.addButton(pluginName, {
          label: pluginSettings.title,
          command: pluginName,
          icon: pluginSettings.icon
        });

        // @todo Add button state handling.
      }
    });
  },
  prepareContent: function(content) {
    // @todo Don't know if we need this yet.
    return content;
  },

  insert: function(content) {
    content = this.prepareContent(content);
    if (CKEDITOR.version.split('.')[0] === '3' && (CKEDITOR.env.webkit || CKEDITOR.env.chrome || CKEDITOR.env.opera || CKEDITOR.env.safari)) {
      // Works around a WebKit bug which removes wrapper elements.
      // @see https://drupal.org/node/1927968
      var tmp = new CKEDITOR.dom.element('div'), children, skip = 0, item;
      tmp.setHtml(content);
      children = tmp.getChildren();
      skip = 0;
      while (children.count() > skip) {
        item = children.getItem(skip);
        switch(item.type) {
          case 1:
            CKEDITOR.instances[this.field].insertElement(item);
            break;
          case 3:
            CKEDITOR.instances[this.field].insertText(item.getText());
            skip++;
            break;
          case 8:
            CKEDITOR.instances[this.field].insertHtml(item.getOuterHtml());
            skip++;
            break;
        }
      }
    }
    else {
      CKEDITOR.instances[this.field].insertHtml(content);
    }
  },

  setContent: function (content) {
    CKEDITOR.instances[this.field].setData(content);
  },

  getContent: function () {
    return CKEDITOR.instances[this.field].getData();
  },

  isFullscreen: function () {
    var cmd = CKEDITOR.instances[this.field].commands.maximize;
    return !!(cmd && cmd.state == CKEDITOR.TRISTATE_ON);
  }
};

})(jQuery);
;
(function($) {

/**
 * Attach this editor to a target element.
 *
 * @param context
 *   A DOM element, supplied by Drupal.attachBehaviors().
 * @param params
 *   An object containing input format parameters. Default parameters are:
 *   - editor: The internal editor name.
 *   - theme: The name/key of the editor theme/profile to use.
 *   - field: The CSS id of the target element.
 * @param settings
 *   An object containing editor settings for all enabled editor themes.
 */
Drupal.wysiwyg.editor.attach.none = function(context, params, settings) {
  if (params.resizable) {
    var $wrapper = $('#' + params.field, context).parents('.form-textarea-wrapper:first');
    $wrapper.addClass('resizable');
    if (Drupal.behaviors.textarea) {
      Drupal.behaviors.textarea.attach(context);
    }
  }
};

/**
 * Detach a single editor instance.
 *
 * The editor syncs its contents back to the original field before its instance
 * is removed.
 *
 * In here, 'this' is an instance of WysiwygInternalInstance.
 * See Drupal.wysiwyg.editor.instance.none for more details.
 *
 * @param context
 *   A DOM element, supplied by Drupal.attachBehaviors().
 * @param params
 *   An object containing input format parameters. Only the editor instance in
 *   params.field should be detached and saved, so its data can be submitted in
 *   AJAX/AHAH applications.
 * @param trigger
 *   A string describing why the editor is being detached.
 *   Possible triggers are:
 *   - unload: (default) Another or no editor is about to take its place.
 *   - move: Currently expected to produce the same result as unload.
 *   - serialize: The form is about to be serialized before an AJAX request or
 *     a normal form submission. If possible, perform a quick detach and leave
 *     the editor's GUI elements in place to avoid flashes or scrolling issues.
 * @see Drupal.detachBehaviors
 */
Drupal.wysiwyg.editor.detach.none = function (context, params, trigger) {
  if (trigger != 'serialize') {
    var $wrapper = $('#' + params.field, context).parents('.form-textarea-wrapper:first');
    $wrapper.removeOnce('textarea').removeClass('.resizable-textarea').removeClass('resizable')
      .find('.grippie').remove();
  }
};

/**
 * Instance methods for plain text areas.
 */
Drupal.wysiwyg.editor.instance.none = {
  insert: function(content) {
    var editor = document.getElementById(this.field);

    // IE support.
    if (document.selection) {
      editor.focus();
      var sel = document.selection.createRange();
      sel.text = content;
    }
    // Mozilla/Firefox/Netscape 7+ support.
    else if (editor.selectionStart || editor.selectionStart == '0') {
      var startPos = editor.selectionStart;
      var endPos = editor.selectionEnd;
      editor.value = editor.value.substring(0, startPos) + content + editor.value.substring(endPos, editor.value.length);
    }
    // Fallback, just add to the end of the content.
    else {
      editor.value += content;
    }
  },

  setContent: function (content) {
    $('#' + this.field).val(content);
  },

  getContent: function () {
    return $('#' + this.field).val();
  }
};

})(jQuery);
;

(function ($) {

/**
 * Auto-hide summary textarea if empty and show hide and unhide links.
 */
Drupal.behaviors.textSummary = {
  attach: function (context, settings) {
    $('.text-summary', context).once('text-summary', function () {
      var $widget = $(this).closest('div.field-type-text-with-summary');
      var $summaries = $widget.find('div.text-summary-wrapper');

      $summaries.once('text-summary-wrapper').each(function(index) {
        var $summary = $(this);
        var $summaryLabel = $summary.find('label').first();
        var $full = $widget.find('.text-full').eq(index).closest('.form-item');
        var $fullLabel = $full.find('label').first();

        // Create a placeholder label when the field cardinality is
        // unlimited or greater than 1.
        if ($fullLabel.length == 0) {
          $fullLabel = $('<label></label>').prependTo($full);
        }

        // Setup the edit/hide summary link.
        var $link = $('<span class="field-edit-link">(<a class="link-edit-summary" href="#">' + Drupal.t('Hide summary') + '</a>)</span>');
        var $a = $link.find('a');
        var toggleClick = true;
        $link.bind('click', function (e) {
          if (toggleClick) {
            $summary.hide();
            $a.html(Drupal.t('Edit summary'));
            $link.appendTo($fullLabel);
          }
          else {
            $summary.show();
            $a.html(Drupal.t('Hide summary'));
            $link.appendTo($summaryLabel);
          }
          toggleClick = !toggleClick;
          return false;
        }).appendTo($summaryLabel);

        // If no summary is set, hide the summary field.
        if ($(this).find('.text-summary').val() == '') {
          $link.click();
        }
      });
    });
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;
(function ($) {

/**
 * Automatically display the guidelines of the selected text format.
 */
Drupal.behaviors.filterGuidelines = {
  attach: function (context) {
    $('.filter-guidelines', context).once('filter-guidelines')
      .find(':header').hide()
      .closest('.filter-wrapper').find('select.filter-list')
      .bind('change', function () {
        $(this).closest('.filter-wrapper')
          .find('.filter-guidelines-item').hide()
          .siblings('.filter-guidelines-' + this.value).show();
      })
      .change();
  }
};

})(jQuery);
;
(function ($) {

/**
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
/**
 * @file
 * Provides JavaScript additions to the managed file field type.
 *
 * This file provides progress bar support (if available), popup windows for
 * file previews, and disabling of other file fields during Ajax uploads (which
 * prevents separate file fields from accidentally uploading files).
 */

(function ($) {

/**
 * Attach behaviors to managed file element upload fields.
 */
Drupal.behaviors.fileValidateAutoAttach = {
  attach: function (context, settings) {
    if (settings.file && settings.file.elements) {
      $.each(settings.file.elements, function(selector) {
        var extensions = settings.file.elements[selector];
        $(selector, context).bind('change', {extensions: extensions}, Drupal.file.validateExtension);
      });
    }
  },
  detach: function (context, settings) {
    if (settings.file && settings.file.elements) {
      $.each(settings.file.elements, function(selector) {
        $(selector, context).unbind('change', Drupal.file.validateExtension);
      });
    }
  }
};

/**
 * Attach behaviors to the file upload and remove buttons.
 */
Drupal.behaviors.fileButtons = {
  attach: function (context) {
    $('input.form-submit', context).bind('mousedown', Drupal.file.disableFields);
    $('div.form-managed-file input.form-submit', context).bind('mousedown', Drupal.file.progressBar);
  },
  detach: function (context) {
    $('input.form-submit', context).unbind('mousedown', Drupal.file.disableFields);
    $('div.form-managed-file input.form-submit', context).unbind('mousedown', Drupal.file.progressBar);
  }
};

/**
 * Attach behaviors to links within managed file elements.
 */
Drupal.behaviors.filePreviewLinks = {
  attach: function (context) {
    $('div.form-managed-file .file a, .file-widget .file a', context).bind('click',Drupal.file.openInNewWindow);
  },
  detach: function (context){
    $('div.form-managed-file .file a, .file-widget .file a', context).unbind('click', Drupal.file.openInNewWindow);
  }
};

/**
 * File upload utility functions.
 */
Drupal.file = Drupal.file || {
  /**
   * Client-side file input validation of file extensions.
   */
  validateExtension: function (event) {
    // Remove any previous errors.
    $('.file-upload-js-error').remove();

    // Add client side validation for the input[type=file].
    var extensionPattern = event.data.extensions.replace(/,\s*/g, '|');
    if (extensionPattern.length > 1 && this.value.length > 0) {
      var acceptableMatch = new RegExp('\\.(' + extensionPattern + ')$', 'gi');
      if (!acceptableMatch.test(this.value)) {
        var error = Drupal.t("The selected file %filename cannot be uploaded. Only files with the following extensions are allowed: %extensions.", {
          // According to the specifications of HTML5, a file upload control
          // should not reveal the real local path to the file that a user
          // has selected. Some web browsers implement this restriction by
          // replacing the local path with "C:\fakepath\", which can cause
          // confusion by leaving the user thinking perhaps Drupal could not
          // find the file because it messed up the file path. To avoid this
          // confusion, therefore, we strip out the bogus fakepath string.
          '%filename': this.value.replace('C:\\fakepath\\', ''),
          '%extensions': extensionPattern.replace(/\|/g, ', ')
        });
        $(this).closest('div.form-managed-file').prepend('<div class="messages error file-upload-js-error" aria-live="polite">' + error + '</div>');
        this.value = '';
        return false;
      }
    }
  },
  /**
   * Prevent file uploads when using buttons not intended to upload.
   */
  disableFields: function (event){
    var clickedButton = this;

    // Only disable upload fields for Ajax buttons.
    if (!$(clickedButton).hasClass('ajax-processed')) {
      return;
    }

    // Check if we're working with an "Upload" button.
    var $enabledFields = [];
    if ($(this).closest('div.form-managed-file').length > 0) {
      $enabledFields = $(this).closest('div.form-managed-file').find('input.form-file');
    }

    // Temporarily disable upload fields other than the one we're currently
    // working with. Filter out fields that are already disabled so that they
    // do not get enabled when we re-enable these fields at the end of behavior
    // processing. Re-enable in a setTimeout set to a relatively short amount
    // of time (1 second). All the other mousedown handlers (like Drupal's Ajax
    // behaviors) are excuted before any timeout functions are called, so we
    // don't have to worry about the fields being re-enabled too soon.
    // @todo If the previous sentence is true, why not set the timeout to 0?
    var $fieldsToTemporarilyDisable = $('div.form-managed-file input.form-file').not($enabledFields).not(':disabled');
    $fieldsToTemporarilyDisable.attr('disabled', 'disabled');
    setTimeout(function (){
      $fieldsToTemporarilyDisable.attr('disabled', false);
    }, 1000);
  },
  /**
   * Add progress bar support if possible.
   */
  progressBar: function (event) {
    var clickedButton = this;
    var $progressId = $(clickedButton).closest('div.form-managed-file').find('input.file-progress');
    if ($progressId.length) {
      var originalName = $progressId.attr('name');

      // Replace the name with the required identifier.
      $progressId.attr('name', originalName.match(/APC_UPLOAD_PROGRESS|UPLOAD_IDENTIFIER/)[0]);

      // Restore the original name after the upload begins.
      setTimeout(function () {
        $progressId.attr('name', originalName);
      }, 1000);
    }
    // Show the progress bar if the upload takes longer than half a second.
    setTimeout(function () {
      $(clickedButton).closest('div.form-managed-file').find('div.ajax-progress-bar').slideDown();
    }, 500);
  },
  /**
   * Open links to files within forms in a new window.
   */
  openInNewWindow: function (event) {
    $(this).attr('target', '_blank');
    window.open(this.href, 'filePreview', 'toolbar=0,scrollbars=1,location=1,statusbar=1,menubar=0,resizable=1,width=500,height=550');
    return false;
  }
};

})(jQuery);
;
/**
 * @file
 * Contains behavior to initialize DnD instances.
 */

(function ($) {
  Drupal.behaviors.dragndropUpload = {
    attach: function (context, settings) {
      if (!settings.dragndropUpload) {
        return;
      }

      $.each(settings.dragndropUpload, function (selector, settings) {
        $(selector, context).once('dnd-upload', function () {
          var $droppable = $(this);

          var dnd;
          // Check if a droppable is a mirror.
          if (settings.asMirrorFor) {
            // Try to get DnD instance.
            dnd = $(settings.asMirrorFor);
            // Add the event callback only if droppable is found.
            if (dnd.size()) {
              // Add an event callback for adding a droppable, because may be
              // the mirrored droppable does not exist yet, so act when it is
              // initiated.
              dnd.one('dnd:init', function () {
                $(this).DnD().addDroppable($droppable);
              });
            }
            // Main droppable area is not found, so remove the processed class.
            else {
              $droppable.removeClass('dnd-upload-processed');
            }
          }
          // Otherwise just create a new droppable instance.
          else {
            dnd = $droppable.DnD(settings);
            $droppable.bind('dnd:showErrors', showErrors.bind(dnd));
            $droppable.bind('dnd:send:options', sendOptions.bind(dnd));
            $droppable.bind('dnd:addFiles:after', afterFilesAdded.bind(dnd));
          }
        });
      });
    },

    detach: function (context, settings) {
      if (settings.dragndropUpload) {
        $.each(settings.dragndropUpload, function (selector) {
          var $droppable = $(selector, context);
          var dnd = $droppable.DnD();
          if (dnd) {
            $droppable.removeClass('dnd-upload-processed');
            dnd.removeDroppable($droppable);
          }
        });
      }
    }
  };

  /**
   * Default dnd:showErrors callback for DnD.
   *
   * @param event
   * @param errors
   */
  var showErrors = function (event, errors) {
    var me = this;
    var messages = [];
    // Go through the errors array and create human-readable messages.
    $.each(errors, function (i, error) {
      if (!me.settings.errorsInfo[error.type]) {
        error.type = 'unknown';
      }
      messages.push(Drupal.t(me.settings.errorsInfo[error.type], error.args));
    });

    alert(messages.join());
  };

  /**
   * Default dnd:send:options callback for DnD.
   *
   * Adds Drupal.ajax support (including ajax commands).
   *
   * @param event
   * @param options
   * @param {DnDFormData} dndFormData
   */
  var sendOptions = function (event, options, dndFormData) {
    var me = this;
    /**
     * Create a simple Drupal.ajax instance.
     */
    var ajaxSettings = {
      url: me.settings.url,
      event: 'dnd-never-triggered'
    };
    var ajax = new Drupal.ajax(false, me.$droppables, ajaxSettings);
    var drupalAjaxOptions = $.extend({}, ajax.options);

    options = $.extend(options, drupalAjaxOptions, {
      cache: false,
      data: null,
      contentType: false,
      processData: false,
      beforeSend: function (xmlhttprequest, options) {
        options.data = drupalAjaxOptions.data;
        
        // Call standard Drupal ajax methods.
        drupalAjaxOptions.beforeSerialize(me.$droppables, options);
        drupalAjaxOptions.beforeSend(xmlhttprequest, options);

        // Put elements from options.data into the dndFormData.
        dndFormData.multiAppend(options.data);
      }
    });
  };

  /**
   * Default dnd:files:after callback for DnD.
   *
   * Send files automatically after they were dropped.
   */
  var afterFilesAdded = function () {
    this.send();
  };
})(jQuery);
;
(function ($) {

/**
 * Toggle the visibility of a fieldset using smooth animations.
 */
Drupal.toggleFieldset = function (fieldset) {
  var $fieldset = $(fieldset);
  if ($fieldset.is('.collapsed')) {
    var $content = $('> .fieldset-wrapper', fieldset).hide();
    $fieldset
      .removeClass('collapsed')
      .trigger({ type: 'collapsed', value: false })
      .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Hide'));
    $content.slideDown({
      duration: 'fast',
      easing: 'linear',
      complete: function () {
        Drupal.collapseScrollIntoView(fieldset);
        fieldset.animating = false;
      },
      step: function () {
        // Scroll the fieldset into view.
        Drupal.collapseScrollIntoView(fieldset);
      }
    });
  }
  else {
    $fieldset.trigger({ type: 'collapsed', value: true });
    $('> .fieldset-wrapper', fieldset).slideUp('fast', function () {
      $fieldset
        .addClass('collapsed')
        .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Show'));
      fieldset.animating = false;
    });
  }
};

/**
 * Scroll a given fieldset into view as much as possible.
 */
Drupal.collapseScrollIntoView = function (node) {
  var h = document.documentElement.clientHeight || document.body.clientHeight || 0;
  var offset = document.documentElement.scrollTop || document.body.scrollTop || 0;
  var posY = $(node).offset().top;
  var fudge = 55;
  if (posY + node.offsetHeight + fudge > h + offset) {
    if (node.offsetHeight > h) {
      window.scrollTo(0, posY);
    }
    else {
      window.scrollTo(0, posY + node.offsetHeight - h + fudge);
    }
  }
};

Drupal.behaviors.collapse = {
  attach: function (context, settings) {
    $('fieldset.collapsible', context).once('collapse', function () {
      var $fieldset = $(this);
      // Expand fieldset if there are errors inside, or if it contains an
      // element that is targeted by the URI fragment identifier.
      var anchor = location.hash && location.hash != '#' ? ', ' + location.hash : '';
      if ($fieldset.find('.error' + anchor).length) {
        $fieldset.removeClass('collapsed');
      }

      var summary = $('<span class="summary"></span>');
      $fieldset.
        bind('summaryUpdated', function () {
          var text = $.trim($fieldset.drupalGetSummary());
          summary.html(text ? ' (' + text + ')' : '');
        })
        .trigger('summaryUpdated');

      // Turn the legend into a clickable link, but retain span.fieldset-legend
      // for CSS positioning.
      var $legend = $('> legend .fieldset-legend', this);

      $('<span class="fieldset-legend-prefix element-invisible"></span>')
        .append($fieldset.hasClass('collapsed') ? Drupal.t('Show') : Drupal.t('Hide'))
        .prependTo($legend)
        .after(' ');

      // .wrapInner() does not retain bound events.
      var $link = $('<a class="fieldset-title" href="#"></a>')
        .prepend($legend.contents())
        .appendTo($legend)
        .click(function () {
          var fieldset = $fieldset.get(0);
          // Don't animate multiple times.
          if (!fieldset.animating) {
            fieldset.animating = true;
            Drupal.toggleFieldset(fieldset);
          }
          return false;
        });

      $legend.append(summary);
    });
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.pathFieldsetSummaries = {
  attach: function (context) {
    $('fieldset.path-form', context).drupalSetSummary(function (context) {
      var path = $('.form-item-path-alias input', context).val();
      var automatic = $('.form-item-path-pathauto input', context).attr('checked');

      if (automatic) {
        return Drupal.t('Automatic alias');
      }
      else if (path) {
        return Drupal.t('Alias: @alias', { '@alias': path });
      }
      else {
        return Drupal.t('No alias');
      }
    });
  }
};

})(jQuery);
;

(function ($) {

Drupal.behaviors.xmlsitemapFieldsetSummaries = {
  attach: function (context) {
    $('fieldset#edit-xmlsitemap', context).drupalSetSummary(function (context) {
      var vals = [];

      // Inclusion select field.
      var status = $('#edit-xmlsitemap-status option:selected').text();
      vals.push(Drupal.t('Inclusion: @value', { '@value': status }));

      // Priority select field.
      var priority = $('#edit-xmlsitemap-priority option:selected').text();
      vals.push(Drupal.t('Priority: @value', { '@value': priority }));

      return vals.join('<br />');
    });
  }
};

})(jQuery);
;

(function ($) {

Drupal.behaviors.nodeFieldsetSummaries = {
  attach: function (context) {
    $('fieldset.node-form-revision-information', context).drupalSetSummary(function (context) {
      var revisionCheckbox = $('.form-item-revision input', context);

      // Return 'New revision' if the 'Create new revision' checkbox is checked,
      // or if the checkbox doesn't exist, but the revision log does. For users
      // without the "Administer content" permission the checkbox won't appear,
      // but the revision log will if the content type is set to auto-revision.
      if (revisionCheckbox.is(':checked') || (!revisionCheckbox.length && $('.form-item-log textarea', context).length)) {
        return Drupal.t('New revision');
      }

      return Drupal.t('No revision');
    });

    $('fieldset.node-form-author', context).drupalSetSummary(function (context) {
      var name = $('.form-item-name input', context).val() || Drupal.settings.anonymous,
        date = $('.form-item-date input', context).val();
      return date ?
        Drupal.t('By @name on @date', { '@name': name, '@date': date }) :
        Drupal.t('By @name', { '@name': name });
    });

    $('fieldset.node-form-options', context).drupalSetSummary(function (context) {
      var vals = [];

      $('input:checked', context).parent().each(function () {
        vals.push(Drupal.checkPlain($.trim($(this).text())));
      });

      if (!$('.form-item-status input', context).is(':checked')) {
        vals.unshift(Drupal.t('Not published'));
      }
      return vals.join(', ');
    });
  }
};

})(jQuery);
;

(function($) {

/**
 * Drupal FieldGroup object.
 */
Drupal.FieldGroup = Drupal.FieldGroup || {};
Drupal.FieldGroup.Effects = Drupal.FieldGroup.Effects || {};
Drupal.FieldGroup.groupWithfocus = null;

Drupal.FieldGroup.setGroupWithfocus = function(element) {
  element.css({display: 'block'});
  Drupal.FieldGroup.groupWithfocus = element;
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processFieldset = {
  execute: function (context, settings, type) {
    if (type == 'form') {
      // Add required fields mark to any fieldsets containing required fields
      $('fieldset.fieldset', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $('legend span.fieldset-legend', $(this)).eq(0).append(' ').append($('.form-required').eq(0).clone());
        }
        if ($('.error', $(this)).length) {
          $('legend span.fieldset-legend', $(this)).eq(0).addClass('error');
          Drupal.FieldGroup.setGroupWithfocus($(this));
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processAccordion = {
  execute: function (context, settings, type) {
    $('div.field-group-accordion-wrapper', context).once('fieldgroup-effects', function () {
      var wrapper = $(this);

      // Get the index to set active.
      var active_index = false;
      wrapper.find('.accordion-item').each(function(i) {
        if ($(this).hasClass('field-group-accordion-active')) {
          active_index = i;
        }
      });

      wrapper.accordion({
        heightStyle: "content",
        active: active_index,
        collapsible: true,
        changestart: function(event, ui) {
          if ($(this).hasClass('effect-none')) {
            ui.options.animated = false;
          }
          else {
            ui.options.animated = 'slide';
          }
        }
      });

      if (type == 'form') {

        var $firstErrorItem = false;

        // Add required fields mark to any element containing required fields
        wrapper.find('div.field-group-accordion-item').each(function(i) {

          if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
            $('h3.ui-accordion-header a').eq(i).append(' ').append($('.form-required').eq(0).clone());
          }
          if ($('.error', $(this)).length) {
            // Save first error item, for focussing it.
            if (!$firstErrorItem) {
              $firstErrorItem = $(this).parent().accordion("activate" , i);
            }
            $('h3.ui-accordion-header').eq(i).addClass('error');
          }
        });

        // Save first error item, for focussing it.
        if (!$firstErrorItem) {
          $('.ui-accordion-content-active', $firstErrorItem).css({height: 'auto', width: 'auto', display: 'block'});
        }

      }
    });
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processHtabs = {
  execute: function (context, settings, type) {
    if (type == 'form') {
      // Add required fields mark to any element containing required fields
      $('fieldset.horizontal-tabs-pane', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $(this).data('horizontalTab').link.find('strong:first').after($('.form-required').eq(0).clone()).after(' ');
        }
        if ($('.error', $(this)).length) {
          $(this).data('horizontalTab').link.parent().addClass('error');
          Drupal.FieldGroup.setGroupWithfocus($(this));
          $(this).data('horizontalTab').focus();
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processTabs = {
  execute: function (context, settings, type) {
    if (type == 'form') {

      var errorFocussed = false;

      // Add required fields mark to any fieldsets containing required fields
      $('fieldset.vertical-tabs-pane', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $(this).data('verticalTab').link.find('strong:first').after($('.form-required').eq(0).clone()).after(' ');
        }
        if ($('.error', $(this)).length) {
          $(this).data('verticalTab').link.parent().addClass('error');
          // Focus the first tab with error.
          if (!errorFocussed) {
            Drupal.FieldGroup.setGroupWithfocus($(this));
            $(this).data('verticalTab').focus();
            errorFocussed = true;
          }
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 *
 * TODO clean this up meaning check if this is really
 *      necessary.
 */
Drupal.FieldGroup.Effects.processDiv = {
  execute: function (context, settings, type) {

    $('div.collapsible', context).once('fieldgroup-effects', function() {
      var $wrapper = $(this);

      // Turn the legend into a clickable link, but retain span.field-group-format-toggler
      // for CSS positioning.

      var $toggler = $('span.field-group-format-toggler:first', $wrapper);
      var $link = $('<a class="field-group-format-title" href="#"></a>');
      $link.prepend($toggler.contents());

      // Add required field markers if needed
      if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
        $link.append(' ').append($('.form-required').eq(0).clone());
      }

      $link.appendTo($toggler);

      // .wrapInner() does not retain bound events.
      $link.click(function () {
        var wrapper = $wrapper.get(0);
        // Don't animate multiple times.
        if (!wrapper.animating) {
          wrapper.animating = true;
          var speed = $wrapper.hasClass('speed-fast') ? 300 : 1000;
          if ($wrapper.hasClass('effect-none') && $wrapper.hasClass('speed-none')) {
            $('> .field-group-format-wrapper', wrapper).toggle();
          }
          else if ($wrapper.hasClass('effect-blind')) {
            $('> .field-group-format-wrapper', wrapper).toggle('blind', {}, speed);
          }
          else {
            $('> .field-group-format-wrapper', wrapper).toggle(speed);
          }
          wrapper.animating = false;
        }
        $wrapper.toggleClass('collapsed');
        return false;
      });

    });
  }
};

/**
 * Behaviors.
 */
Drupal.behaviors.fieldGroup = {
  attach: function (context, settings) {
    settings.field_group = settings.field_group || Drupal.settings.field_group;
    if (settings.field_group == undefined) {
      return;
    }

    // Execute all of them.
    $.each(Drupal.FieldGroup.Effects, function (func) {
      // We check for a wrapper function in Drupal.field_group as
      // alternative for dynamic string function calls.
      var type = func.toLowerCase().replace("process", "");
      if (settings.field_group[type] != undefined && $.isFunction(this.execute)) {
        this.execute(context, settings, settings.field_group[type]);
      }
    });

    // Fixes css for fieldgroups under vertical tabs.
    $('.fieldset-wrapper .fieldset > legend').css({display: 'block'});
    $('.vertical-tabs fieldset.fieldset').addClass('default-fallback');

    // Add a new ID to each fieldset.
    $('.group-wrapper .horizontal-tabs-panes > fieldset', context).once('group-wrapper-panes-processed', function() {
      // Tats bad, but we have to keep the actual id to prevent layouts to break.
      var fieldgroupID = 'field_group-' + $(this).attr('id');
      $(this).attr('id', fieldgroupID);
    });
    // Set the hash in url to remember last userselection.
    $('.group-wrapper ul li').once('group-wrapper-ul-processed', function() {
      var fieldGroupNavigationListIndex = $(this).index();
      $(this).children('a').click(function() {
        var fieldset = $('.group-wrapper fieldset').get(fieldGroupNavigationListIndex);
        // Grab the first id, holding the wanted hashurl.
        var hashUrl = $(fieldset).attr('id').replace(/^field_group-/, '').split(' ')[0];
        window.location.hash = hashUrl;
      });
    });

  }
};

})(jQuery);
;
(function($) {
'use strict';

// Add wave effect.
Drupal.behaviors.adminimal_material_wave_effect = {
  attach: function (context, settings) {
    // Init Waves
    $( ".action-links li a" ).addClass("waves-effect waves-button waves-float waves-classic");
    //$( ".form-actions input" ).addClass("waves-effect");
    //$( 'input[type="submit"]' ).addClass("waves-effect");
    $( "#navigation ul.tabs.primary li a" ).addClass("waves-effect waves-button waves-classic");
    $( "#navigation ul.tabs.secondary li a" ).addClass("waves-effect waves-button waves-classic");
    $( "#admin-menu a" ).addClass("waves-effect waves-button waves-light waves-classic");
    $( ".theme-info .operations a" ).addClass("waves-effect waves-button waves-classic");
    $( "table tbody td a" ).addClass("waves-effect waves-button waves-classic");
  }
};

})(jQuery);

/*!
 * Waves v0.6.6
 * http://fian.my.id/Waves
 *
 * Copyright 2014 Alfiana E. Sibuea and other contributors
 * Released under the MIT license
 * https://github.com/fians/Waves/blob/master/LICENSE
 */

;(function(window, factory) {
    "use strict";

    // AMD. Register as an anonymous module.  Wrap in function so we have access
    // to root via `this`.
    if (typeof define === "function" && define.amd) {
        define([], function() {
            return factory.apply(window);
        });
    }

    // Node. Does not work with strict CommonJS, but only CommonJS-like
    // environments that support module.exports, like Node.
    else if (typeof exports === "object") {
        module.exports = factory.call(window);
    }

    // Browser globals.
    else {
        window.Waves = factory.call(window);
    }
})(typeof global === "object" ? global : this, function () {
    "use strict";

    var Waves = Waves || {};
    var $$ = document.querySelectorAll.bind(document);

    // Find exact position of element
    function isWindow(obj) {
        return obj !== null && obj === obj.window;
    }

    function getWindow(elem) {
        return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
    }

    function offset(elem) {
        var docElem, win,
            box = {top: 0, left: 0},
            doc = elem && elem.ownerDocument;

        docElem = doc.documentElement;

        if (typeof elem.getBoundingClientRect !== typeof undefined) {
            box = elem.getBoundingClientRect();
        }
        win = getWindow(doc);
        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }

    function convertStyle(obj) {
        var style = '';

        for (var a in obj) {
            if (obj.hasOwnProperty(a)) {
                style += (a + ':' + obj[a] + ';');
            }
        }

        return style;
    }

    var Effect = {

        // Effect delay
        duration: 750,

        show: function(e, element) {

            // Disable right click
            if (e.button === 2) {
                return false;
            }

            var el = element || this;

            // Create ripple
            var ripple = document.createElement('div');
            ripple.className = 'waves-ripple';
            el.appendChild(ripple);

            // Get click coordinate and element witdh
            var pos         = offset(el);
            var relativeY   = (e.pageY - pos.top);
            var relativeX   = (e.pageX - pos.left);
            var scale       = 'scale('+((el.clientWidth / 100) * 3)+')';

            // Support for touch devices
            if ('touches' in e) {
              relativeY   = (e.touches[0].pageY - pos.top);
              relativeX   = (e.touches[0].pageX - pos.left);
            }

            // Attach data to element
            ripple.setAttribute('data-hold', Date.now());
            ripple.setAttribute('data-scale', scale);
            ripple.setAttribute('data-x', relativeX);
            ripple.setAttribute('data-y', relativeY);

            // Set ripple position
            var rippleStyle = {
                'top': relativeY+'px',
                'left': relativeX+'px'
            };

            ripple.className = ripple.className + ' waves-notransition';
            ripple.setAttribute('style', convertStyle(rippleStyle));
            ripple.className = ripple.className.replace('waves-notransition', '');

            // Scale the ripple
            rippleStyle['-webkit-transform'] = scale;
            rippleStyle['-moz-transform'] = scale;
            rippleStyle['-ms-transform'] = scale;
            rippleStyle['-o-transform'] = scale;
            rippleStyle.transform = scale;
            rippleStyle.opacity   = '1';

            rippleStyle['-webkit-transition-duration'] = Effect.duration + 'ms';
            rippleStyle['-moz-transition-duration']    = Effect.duration + 'ms';
            rippleStyle['-o-transition-duration']      = Effect.duration + 'ms';
            rippleStyle['transition-duration']         = Effect.duration + 'ms';

            ripple.setAttribute('style', convertStyle(rippleStyle));
        },

        hide: function(e) {
            TouchHandler.touchup(e);

            var el = this;
            var width = el.clientWidth * 1.4;

            // Get first ripple
            var ripple = null;
            var ripples = el.getElementsByClassName('waves-ripple');
            if (ripples.length > 0) {
                ripple = ripples[ripples.length - 1];
            } else {
                return false;
            }

            var relativeX   = ripple.getAttribute('data-x');
            var relativeY   = ripple.getAttribute('data-y');
            var scale       = ripple.getAttribute('data-scale');

            // Get delay beetween mousedown and mouse leave
            var diff = Date.now() - Number(ripple.getAttribute('data-hold'));
            var delay = 350 - diff;

            if (delay < 0) {
                delay = 0;
            }

            // Fade out ripple after delay
            setTimeout(function() {
                var style = {
                    'top': relativeY+'px',
                    'left': relativeX+'px',
                    'opacity': '0',

                    // Duration
                    '-webkit-transition-duration': Effect.duration + 'ms',
                    '-moz-transition-duration': Effect.duration + 'ms',
                    '-o-transition-duration': Effect.duration + 'ms',
                    'transition-duration': Effect.duration + 'ms',
                    '-webkit-transform': scale,
                    '-moz-transform': scale,
                    '-ms-transform': scale,
                    '-o-transform': scale,
                    'transform': scale
                };

                ripple.setAttribute('style', convertStyle(style));

                setTimeout(function() {
                    try {
                        el.removeChild(ripple);
                    } catch(e) {
                        return false;
                    }
                }, Effect.duration);
            }, delay);
        },

        // Little hack to make <input> can perform waves effect
        wrapInput: function(elements) {
            for (var a = 0; a < elements.length; a++) {
                var el = elements[a];

                if (el.tagName.toLowerCase() === 'input') {
                    var parent = el.parentNode;

                    // If input already have parent just pass through
                    if (parent.tagName.toLowerCase() === 'i' && parent.className.indexOf('waves-effect') !== -1) {
                        continue;
                    }

                    // Put element class and style to the specified parent
                    var wrapper = document.createElement('i');
                    wrapper.className = el.className + ' waves-input-wrapper';

                    var elementStyle = el.getAttribute('style');

                    if (!elementStyle) {
                        elementStyle = '';
                    }

                    wrapper.setAttribute('style', elementStyle);

                    el.className = 'waves-button-input';
                    el.removeAttribute('style');

                    // Put element as child
                    parent.replaceChild(wrapper, el);
                    wrapper.appendChild(el);
                }
            }
        }
    };


    /**
     * Disable mousedown event for 500ms during and after touch
     */
    var TouchHandler = {
        /* uses an integer rather than bool so there's no issues with
         * needing to clear timeouts if another touch event occurred
         * within the 500ms. Cannot mouseup between touchstart and
         * touchend, nor in the 500ms after touchend. */
        touches: 0,
        allowEvent: function(e) {
            var allow = true;

            if (e.type === 'touchstart') {
                TouchHandler.touches += 1; //push
            } else if (e.type === 'touchend' || e.type === 'touchcancel') {
                setTimeout(function() {
                    if (TouchHandler.touches > 0) {
                        TouchHandler.touches -= 1; //pop after 500ms
                    }
                }, 500);
            } else if (e.type === 'mousedown' && TouchHandler.touches > 0) {
                allow = false;
            }

            return allow;
        },
        touchup: function(e) {
            TouchHandler.allowEvent(e);
        }
    };


    /**
     * Delegated click handler for .waves-effect element.
     * returns null when .waves-effect element not in "click tree"
     */
    function getWavesEffectElement(e) {
        if (TouchHandler.allowEvent(e) === false) {
            return null;
        }

        var element = null;
        var target = e.target || e.srcElement;

        while (target.parentElement !== null) {
            if (!(target instanceof SVGElement) && target.className.indexOf('waves-effect') !== -1) {
                element = target;
                break;
            } else if (target.classList.contains('waves-effect')) {
                element = target;
                break;
            }
            target = target.parentElement;
        }

        return element;
    }

    /**
     * Bubble the click and show effect if .waves-effect elem was found
     */
    function showEffect(e) {
        var element = getWavesEffectElement(e);

        if (element !== null) {
            Effect.show(e, element);

            if ('ontouchstart' in window) {
                element.addEventListener('touchend', Effect.hide, false);
                element.addEventListener('touchcancel', Effect.hide, false);
            }

            element.addEventListener('mouseup', Effect.hide, false);
            element.addEventListener('mouseleave', Effect.hide, false);
        }
    }

    Waves.displayEffect = function(options) {
        options = options || {};

        if ('duration' in options) {
            Effect.duration = options.duration;
        }

        //Wrap input inside <i> tag
        Effect.wrapInput($$('.waves-effect'));

        if ('ontouchstart' in window) {
            document.body.addEventListener('touchstart', showEffect, false);
        }

        document.body.addEventListener('mousedown', showEffect, false);
    };

    /**
     * Attach Waves to an input element (or any element which doesn't
     * bubble mouseup/mousedown events).
     *   Intended to be used with dynamically loaded forms/inputs, or
     * where the user doesn't want a delegated click handler.
     */
    Waves.attach = function(element) {
        //FUTURE: automatically add waves classes and allow users
        // to specify them with an options param? Eg. light/classic/button
        if (element.tagName.toLowerCase() === 'input') {
            Effect.wrapInput([element]);
            element = element.parentElement;
        }

        if ('ontouchstart' in window) {
            element.addEventListener('touchstart', showEffect, false);
        }

        element.addEventListener('mousedown', showEffect, false);
    };

    return Waves;
});

// Init Waves
(function ($) {
  Drupal.behaviors.wavesInit = {
    attach: function (context, settings) {
        Waves.displayEffect();
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
/*!
	SlickNav Responsive Mobile Menu
	(c) 2014 Josh Cope
	licensed under MIT
*/
;(function ($, document, window) {
  var
    // default settings object.
    defaults = {
      label: 'MENU',
      duplicate: true,
      duration: 200,
      easingOpen: 'swing',
      easingClose: 'swing',
      closedSymbol: '&#9658;',
      openedSymbol: '&#9660;',
      prependTo: 'body',
      parentTag: 'a',
      closeOnClick: false,
      allowParentLinks: false,
      init: function () {
      },
      open: function () {
      },
      close: function () {
      }
    },
    mobileMenu = 'slicknav',
    prefix = 'slicknav';

  function Plugin(element, options) {
    this.element = element;

    // jQuery has an extend method which merges the contents of two or
    // more objects, storing the result in the first object. The first object
    // is generally empty as we don't want to alter the default options for
    // future instances of the plugin
    this.settings = $.extend({}, defaults, options);

    this._defaults = defaults;
    this._name = mobileMenu;

    this.init();
  }

  Plugin.prototype.init = function () {
    var $this = this;
    var menu = $(this.element);
    var settings = this.settings;

    // clone menu if needed
    if (settings.duplicate) {
      $this.mobileNav = menu.clone();
      //remove ids from clone to prevent css issues
      $this.mobileNav.removeAttr('id');
      $this.mobileNav.find('*').each(function (i, e) {
        $(e).removeAttr('id');
      });
    }
    else {
      $this.mobileNav = menu;
    }

    // styling class for the button
    var iconClass = prefix + '_icon';

    if (settings.label == '') {
      iconClass += ' ' + prefix + '_no-text';
    }

    if (settings.parentTag == 'a') {
      settings.parentTag = 'a href="#"';
    }

    // create menu bar
    $this.mobileNav.attr('class', prefix + '_nav');
    var menuBar = $('<div class="' + prefix + '_menu"></div>');
    $this.btn = $('<' + settings.parentTag + ' aria-haspopup="true" tabindex="0" class="' + prefix + '_btn ' + prefix + '_collapsed"><span class="' + prefix + '_menutxt">' + settings.label + '</span><span class="' + iconClass + '"><span class="' + prefix + '_icon-bar"></span><span class="' + prefix + '_icon-bar"></span><span class="' + prefix + '_icon-bar"></span></span></a>');
    $(menuBar).append($this.btn);
    $(settings.prependTo).prepend(menuBar);
    menuBar.append($this.mobileNav);

    // iterate over structure adding additional structure
    var items = $this.mobileNav.find('li');
    $(items).each(function () {
      var item = $(this);
      var data = {};
      data.children = item.children('ul').attr('role', 'menu');
      item.data("menu", data);

      // if a list item has a nested menu
      if (data.children.length > 0) {

        // select all text before the child menu
        var a = item.contents();
        var nodes = [];
        $(a).each(function () {
          if (!$(this).is("ul")) {
            nodes.push(this);
          }
          else {
            return false;
          }
        });

        // wrap item text with tag and add classes
        var wrap = $(nodes).wrapAll('<' + settings.parentTag + ' role="menuitem" aria-haspopup="true" tabindex="-1" class="' + prefix + '_item"/>').parent();

        item.addClass(prefix + '_collapsed');
        item.addClass(prefix + '_parent');

        // create parent arrow
        $(nodes).last().after('<span class="' + prefix + '_arrow">' + settings.closedSymbol + '</span>');


      }
      else {
        if (item.children().length == 0) {
          item.addClass(prefix + '_txtnode');
        }
      }

      // accessibility for links
      item.children('a').attr('role', 'menuitem').click(function () {
        //Emulate menu close if set
        if (settings.closeOnClick) {
          $($this.btn).click();
        }
      });
    });

    // structure is in place, now hide appropriate items
    $(items).each(function () {
      var data = $(this).data("menu");
      $this._visibilityToggle(data.children, false, null, true);
    });

    // finally toggle entire menu
    $this._visibilityToggle($this.mobileNav, false, 'init', true);

    // accessibility for menu button
    $this.mobileNav.attr('role', 'menu');

    // outline prevention when using mouse
    $(document).mousedown(function () {
      $this._outlines(false);
    });

    $(document).keyup(function () {
      $this._outlines(true);
    });

    // menu button click
    $($this.btn).click(function (e) {
      e.preventDefault();
      $this._menuToggle();
    });

    // click on menu parent
    $this.mobileNav.on('click', '.' + prefix + '_item', function (e) {
      e.preventDefault();
      $this._itemClick($(this));
    });

    // check for enter key on menu button and menu parents
    $($this.btn).keydown(function (e) {
      var ev = e || event;
      if (ev.keyCode == 13) {
        e.preventDefault();
        $this._menuToggle();
      }
    });

    $this.mobileNav.on('keydown', '.' + prefix + '_item', function (e) {
      var ev = e || event;
      if (ev.keyCode == 13) {
        e.preventDefault();
        $this._itemClick($(e.target));
      }
    });

    // allow links clickable within parent tags if set
    if (settings.allowParentLinks) {
      $('.' + prefix + '_item a').click(function (e) {
        e.stopImmediatePropagation();
      });
    }
  };

  //toggle menu
  Plugin.prototype._menuToggle = function (el) {
    var $this = this;
    var btn = $this.btn;
    var mobileNav = $this.mobileNav;

    if (btn.hasClass(prefix + '_collapsed')) {
      btn.removeClass(prefix + '_collapsed');
      btn.addClass(prefix + '_open');
    }
    else {
      btn.removeClass(prefix + '_open');
      btn.addClass(prefix + '_collapsed');
    }
    btn.addClass(prefix + '_animating');
    $this._visibilityToggle(mobileNav, true, btn);
  };

  // toggle clicked items
  Plugin.prototype._itemClick = function (el) {
    var $this = this;
    var settings = $this.settings;
    var data = el.data("menu");
    if (!data) {
      data = {};
      data.arrow = el.children('.' + prefix + '_arrow');
      data.ul = el.next('ul');
      data.parent = el.parent();
      el.data("menu", data);
    }
    if (data.parent.hasClass(prefix + '_collapsed')) {
      data.arrow.html(settings.openedSymbol);
      data.parent.removeClass(prefix + '_collapsed');
      data.parent.addClass(prefix + '_open');
      data.parent.addClass(prefix + '_animating');
      $this._visibilityToggle(data.ul, true, el);
    }
    else {
      data.arrow.html(settings.closedSymbol);
      data.parent.addClass(prefix + '_collapsed');
      data.parent.removeClass(prefix + '_open');
      data.parent.addClass(prefix + '_animating');
      $this._visibilityToggle(data.ul, true, el);
    }
  };

  // toggle actual visibility and accessibility tags
  Plugin.prototype._visibilityToggle = function (el, animate, trigger, init) {
    var $this = this;
    var settings = $this.settings;
    var items = $this._getActionItems(el);
    var duration = 0;
    if (animate) {
      duration = settings.duration;
    }

    if (el.hasClass(prefix + '_hidden')) {
      el.removeClass(prefix + '_hidden');
      el.slideDown(duration, settings.easingOpen, function () {

        $(trigger).removeClass(prefix + '_animating');
        $(trigger).parent().removeClass(prefix + '_animating');

        //Fire open callback
        if (!init) {
          settings.open(trigger);
        }
      });
      el.attr('aria-hidden', 'false');
      items.attr('tabindex', '0');
      $this._setVisAttr(el, false);
    }
    else {
      el.addClass(prefix + '_hidden');
      el.slideUp(duration, this.settings.easingClose, function () {
        el.attr('aria-hidden', 'true');
        items.attr('tabindex', '-1');
        $this._setVisAttr(el, true);
        el.hide(); //jQuery 1.7 bug fix

        $(trigger).removeClass(prefix + '_animating');
        $(trigger).parent().removeClass(prefix + '_animating');

        //Fire init or close callback
        if (!init) {
          settings.close(trigger);
        }
        else {
          if (trigger == 'init') {
            settings.init();
          }
        }
      });
    }
  };

  // set attributes of element and children based on visibility
  Plugin.prototype._setVisAttr = function (el, hidden) {
    var $this = this;

    // select all parents that aren't hidden
    var nonHidden = el.children('li').children('ul').not('.' + prefix + '_hidden');

    // iterate over all items setting appropriate tags
    if (!hidden) {
      nonHidden.each(function () {
        var ul = $(this);
        ul.attr('aria-hidden', 'false');
        var items = $this._getActionItems(ul);
        items.attr('tabindex', '0');
        $this._setVisAttr(ul, hidden);
      });
    }
    else {
      nonHidden.each(function () {
        var ul = $(this);
        ul.attr('aria-hidden', 'true');
        var items = $this._getActionItems(ul);
        items.attr('tabindex', '-1');
        $this._setVisAttr(ul, hidden);
      });
    }
  };

  // get all 1st level items that are clickable
  Plugin.prototype._getActionItems = function (el) {
    var data = el.data("menu");
    if (!data) {
      data = {};
      var items = el.children('li');
      var anchors = items.children('a');
      data.links = anchors.add(items.children('.' + prefix + '_item'));
      el.data("menu", data);
    }
    return data.links;
  };

  Plugin.prototype._outlines = function (state) {
    if (!state) {
      $('.' + prefix + '_item, .' + prefix + '_btn').css('outline', 'none');
    }
    else {
      $('.' + prefix + '_item, .' + prefix + '_btn').css('outline', '');
    }
  }

  Plugin.prototype.toggle = function () {
    $this._menuToggle();
  };

  Plugin.prototype.open = function () {
    $this = this;
    if ($this.btn.hasClass(prefix + '_collapsed')) {
      $this._menuToggle();
    }
  };

  Plugin.prototype.close = function () {
    $this = this;
    if ($this.btn.hasClass(prefix + '_open')) {
      $this._menuToggle();
    }
  };

  $.fn[mobileMenu] = function (options) {
    var args = arguments;

    // Is the first parameter an object (options), or was omitted, instantiate
    // a new instance
    if (options === undefined || typeof options === 'object') {
      return this.each(function () {

        // Only allow the plugin to be instantiated once due to methods
        if (!$.data(this, 'plugin_' + mobileMenu)) {

          // if it has no instance, create a new one, pass options to our
          // plugin constructor, and store the plugin instance in the elements
          // jQuery data object.
          $.data(this, 'plugin_' + mobileMenu, new Plugin(this, options));
        }
      });

      // If is a string and doesn't start with an underscore or 'init'
      // function, treat this as a call to a public method.
    }
    else {
      if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

        // Cache the method call to make it possible to return a value
        var returns;

        this.each(function () {
          var instance = $.data(this, 'plugin_' + mobileMenu);

          // Tests that there's already a plugin-instance and checks that the
          // requested public method exists
          if (instance instanceof Plugin && typeof instance[options] === 'function') {

            // Call the method of our plugin instance, and pass it the supplied
            // arguments.
            returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
          }
        });

        // If the earlier cached method gives a value back return the value,
        // otherwise return this to preserve chainability.
        return returns !== undefined ? returns : this;
      }
    }
  };
}(jQuery, document, window));

(function ($) {

  Drupal.admin = Drupal.admin || {};
  Drupal.admin.behaviors = Drupal.admin.behaviors || {};

  // Create the responsive menu using SlickNav.
  Drupal.admin.behaviors.responsivemenu = function (context, settings, $adminMenu) {

    $('#admin-menu-menu-responsive').slicknav({
      label: Drupal.t('Menu'),
      prependTo: 'body',
      closedSymbol: "<i class=\"closed\"></i>",
      openedSymbol: "<i class=\"open\"></i>",
      allowParentLinks: true
    });

  };

  // Create the responsive shortcuts dropdown.
  Drupal.admin.behaviors.responsiveshortcuts = function (context, settings, $adminMenu) {

    // Check if there are any shortucts to respondify.
    if (jQuery("div.toolbar-shortcuts ul.menu li").length) {

      // Create the dropdown base
      $('<select id="responsive-shortcuts-dropdown"/>').appendTo("#admin-menu-shortcuts-responsive div.toolbar-shortcuts");

      // Create default option "Select"
      $("<option />", {
        "selected": "selected",
        "class": "hide",
        "value": "",
        "text": Drupal.t('Shortcuts')
      }).appendTo("#admin-menu-shortcuts-responsive div.toolbar-shortcuts select");

      // Populate dropdown with menu items
      $("#admin-menu-shortcuts-responsive div.toolbar-shortcuts a").each(function () {
        var el = $(this);
        $("<option />", {
          "value": el.attr("href"),
          "text": el.text()
        }).appendTo("#admin-menu-shortcuts-responsive div.toolbar-shortcuts select");
      });

      // Redirect the user when selecting an option.
      $("#admin-menu-shortcuts-responsive div.toolbar-shortcuts select").change(function () {
        window.location = $(this).find("option:selected").val();
      });

      // Clean the mess.
      $('#admin-menu-shortcuts-responsive div.toolbar-shortcuts ul').remove();
      // Move the select box into the responsive menu.
      $("#admin-menu-shortcuts-responsive").prependTo(".slicknav_menu");

    }

    // Remove the edit shortcuts link from the DOM to avoid duble rendering.
    $('#admin-menu-shortcuts-responsive #edit-shortcuts').remove();

  };
})(jQuery);;
(function ($) {

  Drupal.admin = Drupal.admin || {};
  Drupal.admin.behaviors = Drupal.admin.behaviors || {};

  /**
   * @ingroup admin_behaviors
   * @{
   */

  /**
   * Apply active trail highlighting based on current path.
   *
   * @todo Not limited to toolbar; move into core?
   */
  Drupal.admin.behaviors.toolbarActiveTrail = function (context, settings, $adminMenu) {
    if (settings.admin_menu.toolbar && settings.admin_menu.toolbar.activeTrail) {
      $adminMenu.find('> div > ul > li > a[href="' + settings.admin_menu.toolbar.activeTrail + '"]').addClass('active-trail');
    }
  };

  Drupal.admin.behaviors.shorcutcollapsed = function (context, settings, $adminMenu) {

    // Create the dropdown base
    $('<li class="label"><a>' + Drupal.t('Shortcuts') + '</a></li>').prependTo("body.menu-render-collapsed #toolbar div.toolbar-shortcuts ul");

  };

  Drupal.admin.behaviors.shorcutselect = function (context, settings, $adminMenu) {

    // Create the dropdown base
    $('<select id="shortcut-menu"/>').appendTo("body.menu-render-dropdown #toolbar div.toolbar-shortcuts");

    // Create default option "Select"
    $("<option />", {
      "selected": "selected",
      "value": "",
      "text": Drupal.t('Shortcuts')
    }).appendTo("body.menu-render-dropdown #toolbar div.toolbar-shortcuts select");

    // Populate dropdown with menu items
    $("body.menu-render-dropdown #toolbar div.toolbar-shortcuts a").each(function () {
      var el = $(this);
      $("<option />", {
        "value": el.attr("href"),
        "text": el.text()
      }).appendTo("body.menu-render-dropdown #toolbar div.toolbar-shortcuts select");
    });

    $("body.menu-render-dropdown #toolbar div.toolbar-shortcuts select").change(function () {
      window.location = $(this).find("option:selected").val();
    });

    $('body.menu-render-dropdown #toolbar div.toolbar-shortcuts ul').remove();

  };

  // Ovveride front link if changed by another module for the mobile menu.
  Drupal.admin.behaviors.mobile_front_link = function (context, settings, $adminMenu) {
    $("ul.slicknav_nav li.admin-menu-toolbar-home-menu a>a").attr("href", $("#admin-menu-icon > li > a").attr('href'));
  };

})(jQuery);
;

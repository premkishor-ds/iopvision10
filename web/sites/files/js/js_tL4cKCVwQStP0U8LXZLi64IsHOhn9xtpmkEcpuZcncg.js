
(function ($) {

/**
 * This script transforms a set of fieldsets into a stack of vertical
 * tabs. Another tab pane can be selected by clicking on the respective
 * tab.
 *
 * Each tab may have a summary which can be updated by another
 * script. For that to work, each fieldset has an associated
 * 'verticalTabCallback' (with jQuery.data() attached to the fieldset),
 * which is called every time the user performs an update to a form
 * element inside the tab pane.
 */
Drupal.behaviors.verticalTabs = {
  attach: function (context) {
    $('.vertical-tabs-panes', context).once('vertical-tabs', function () {
      var focusID = $(':hidden.vertical-tabs-active-tab', this).val();
      var tab_focus;

      // Check if there are some fieldsets that can be converted to vertical-tabs
      var $fieldsets = $('> fieldset', this);
      if ($fieldsets.length == 0) {
        return;
      }

      // Create the tab column.
      var tab_list = $('<ul class="vertical-tabs-list"></ul>');
      $(this).wrap('<div class="vertical-tabs clearfix"></div>').before(tab_list);

      // Transform each fieldset into a tab.
      $fieldsets.each(function () {
        var vertical_tab = new Drupal.verticalTab({
          title: $('> legend', this).text(),
          fieldset: $(this)
        });
        tab_list.append(vertical_tab.item);
        $(this)
          .removeClass('collapsible collapsed')
          .addClass('vertical-tabs-pane')
          .data('verticalTab', vertical_tab);
        if (this.id == focusID) {
          tab_focus = $(this);
        }
      });

      $('> li:first', tab_list).addClass('first');
      $('> li:last', tab_list).addClass('last');

      if (!tab_focus) {
        // If the current URL has a fragment and one of the tabs contains an
        // element that matches the URL fragment, activate that tab.
        if (window.location.hash && $(this).find(window.location.hash).length) {
          tab_focus = $(this).find(window.location.hash).closest('.vertical-tabs-pane');
        }
        else {
          tab_focus = $('> .vertical-tabs-pane:first', this);
        }
      }
      if (tab_focus.length) {
        tab_focus.data('verticalTab').focus();
      }
    });
  }
};

/**
 * The vertical tab object represents a single tab within a tab group.
 *
 * @param settings
 *   An object with the following keys:
 *   - title: The name of the tab.
 *   - fieldset: The jQuery object of the fieldset that is the tab pane.
 */
Drupal.verticalTab = function (settings) {
  var self = this;
  $.extend(this, settings, Drupal.theme('verticalTab', settings));

  this.link.click(function () {
    self.focus();
    return false;
  });

  // Keyboard events added:
  // Pressing the Enter key will open the tab pane.
  this.link.keydown(function(event) {
    if (event.keyCode == 13) {
      self.focus();
      // Set focus on the first input field of the visible fieldset/tab pane.
      $("fieldset.vertical-tabs-pane :input:visible:enabled:first").focus();
      return false;
    }
  });

  this.fieldset
    .bind('summaryUpdated', function () {
      self.updateSummary();
    })
    .trigger('summaryUpdated');
};

Drupal.verticalTab.prototype = {
  /**
   * Displays the tab's content pane.
   */
  focus: function () {
    this.fieldset
      .siblings('fieldset.vertical-tabs-pane')
        .each(function () {
          var tab = $(this).data('verticalTab');
          tab.fieldset.hide();
          tab.item.removeClass('selected');
        })
        .end()
      .show()
      .siblings(':hidden.vertical-tabs-active-tab')
        .val(this.fieldset.attr('id'));
    this.item.addClass('selected');
    // Mark the active tab for screen readers.
    $('#active-vertical-tab').remove();
    this.link.append('<span id="active-vertical-tab" class="element-invisible">' + Drupal.t('(active tab)') + '</span>');
  },

  /**
   * Updates the tab's summary.
   */
  updateSummary: function () {
    this.summary.html(this.fieldset.drupalGetSummary());
  },

  /**
   * Shows a vertical tab pane.
   */
  tabShow: function () {
    // Display the tab.
    this.item.show();
    // Show the vertical tabs.
    this.item.closest('.vertical-tabs').show();
    // Update .first marker for items. We need recurse from parent to retain the
    // actual DOM element order as jQuery implements sortOrder, but not as public
    // method.
    this.item.parent().children('.vertical-tab-button').removeClass('first')
      .filter(':visible:first').addClass('first');
    // Display the fieldset.
    this.fieldset.removeClass('vertical-tab-hidden').show();
    // Focus this tab.
    this.focus();
    return this;
  },

  /**
   * Hides a vertical tab pane.
   */
  tabHide: function () {
    // Hide this tab.
    this.item.hide();
    // Update .first marker for items. We need recurse from parent to retain the
    // actual DOM element order as jQuery implements sortOrder, but not as public
    // method.
    this.item.parent().children('.vertical-tab-button').removeClass('first')
      .filter(':visible:first').addClass('first');
    // Hide the fieldset.
    this.fieldset.addClass('vertical-tab-hidden').hide();
    // Focus the first visible tab (if there is one).
    var $firstTab = this.fieldset.siblings('.vertical-tabs-pane:not(.vertical-tab-hidden):first');
    if ($firstTab.length) {
      $firstTab.data('verticalTab').focus();
    }
    // Hide the vertical tabs (if no tabs remain).
    else {
      this.item.closest('.vertical-tabs').hide();
    }
    return this;
  }
};

/**
 * Theme function for a vertical tab.
 *
 * @param settings
 *   An object with the following keys:
 *   - title: The name of the tab.
 * @return
 *   This function has to return an object with at least these keys:
 *   - item: The root tab jQuery element
 *   - link: The anchor tag that acts as the clickable area of the tab
 *       (jQuery version)
 *   - summary: The jQuery element that contains the tab summary
 */
Drupal.theme.prototype.verticalTab = function (settings) {
  var tab = {};
  tab.item = $('<li class="vertical-tab-button" tabindex="-1"></li>')
    .append(tab.link = $('<a href="#"></a>')
      .append(tab.title = $('<strong></strong>').text(settings.title))
      .append(tab.summary = $('<span class="summary"></span>')
    )
  );
  return tab;
};

})(jQuery);
;
(function ($) {

/**
 * Retrieves the summary for the first element.
 */
$.fn.drupalGetSummary = function () {
  var callback = this.data('summaryCallback');
  return (this[0] && callback) ? $.trim(callback(this[0])) : '';
};

/**
 * Sets the summary for all matched elements.
 *
 * @param callback
 *   Either a function that will be called each time the summary is
 *   retrieved or a string (which is returned each time).
 */
$.fn.drupalSetSummary = function (callback) {
  var self = this;

  // To facilitate things, the callback should always be a function. If it's
  // not, we wrap it into an anonymous function which just returns the value.
  if (typeof callback != 'function') {
    var val = callback;
    callback = function () { return val; };
  }

  return this
    .data('summaryCallback', callback)
    // To prevent duplicate events, the handlers are first removed and then
    // (re-)added.
    .unbind('formUpdated.summary')
    .bind('formUpdated.summary', function () {
      self.trigger('summaryUpdated');
    })
    // The actual summaryUpdated handler doesn't fire when the callback is
    // changed, so we have to do this manually.
    .trigger('summaryUpdated');
};

/**
 * Sends a 'formUpdated' event each time a form element is modified.
 */
Drupal.behaviors.formUpdated = {
  attach: function (context) {
    // These events are namespaced so that we can remove them later.
    var events = 'change.formUpdated click.formUpdated blur.formUpdated keyup.formUpdated';
    $(context)
      // Since context could be an input element itself, it's added back to
      // the jQuery object and filtered again.
      .find(':input').andSelf().filter(':input')
      // To prevent duplicate events, the handlers are first removed and then
      // (re-)added.
      .unbind(events).bind(events, function () {
        $(this).trigger('formUpdated');
      });
  }
};

/**
 * Prepopulate form fields with information from the visitor cookie.
 */
Drupal.behaviors.fillUserInfoFromCookie = {
  attach: function (context, settings) {
    $('form.user-info-from-cookie').once('user-info-from-cookie', function () {
      var formContext = this;
      $.each(['name', 'mail', 'homepage'], function () {
        var $element = $('[name=' + this + ']', formContext);
        var cookie = $.cookie('Drupal.visitor.' + this);
        if ($element.length && cookie) {
          $element.val(cookie);
        }
      });
    });
  }
};

})(jQuery);
;
/**
 * @file
 * Scripting for administrative interfaces of Charts module.
 */
(function ($) {

Drupal.behaviors.chartsAdmin = {};
Drupal.behaviors.chartsAdmin.attach = function(context, settings) {
  // Change options based on the chart type selected.
  $(context).find('.form-radios.chart-type-radios').once('charts-axis-inverted', function() {

    // Manually attach collapsible fieldsets first.
    if (Drupal.behaviors.collapse) {
      Drupal.behaviors.collapse.attach(context, settings);
    }

    var xAxisLabel = $('fieldset.chart-xaxis .fieldset-title').html();
    var yAxisLabel = $('fieldset.chart-yaxis .fieldset-title').html();

    $(this).find('input:radio').change(function() {
      if ($(this).is(':checked')) {
        var groupingField = $(this).closest('form').find('.charts-grouping-field').val();

        // Flip X/Y axis fieldset labels for inverted chart types.
        if ($(this).attr('data-axis-inverted')) {
          $('fieldset.chart-xaxis .fieldset-title').html(yAxisLabel);
          $('fieldset.chart-xaxis .axis-inverted-show').closest('.form-item').show();
          $('fieldset.chart-xaxis .axis-inverted-hide').closest('.form-item').hide();
          $('fieldset.chart-yaxis .fieldset-title').html(xAxisLabel);
          $('fieldset.chart-yaxis .axis-inverted-show').closest('.form-item').show();
          $('fieldset.chart-yaxis .axis-inverted-hide').closest('.form-item').hide();
        }
        else {
          $('fieldset.chart-xaxis .fieldset-title').html(xAxisLabel);
          $('fieldset.chart-xaxis .axis-inverted-show').closest('.form-item').hide();
          $('fieldset.chart-xaxis .axis-inverted-hide').closest('.form-item').show();
          $('fieldset.chart-yaxis .fieldset-title').html(yAxisLabel);
          $('fieldset.chart-yaxis .axis-inverted-show').closest('.form-item').hide();
          $('fieldset.chart-yaxis .axis-inverted-hide').closest('.form-item').show();
        }

        // Show color options for single axis settings.
        if ($(this).attr('data-axis-single')) {
          $('fieldset.chart-xaxis').hide();
          $('fieldset.chart-yaxis').hide();
          $('th.chart-field-color, td.chart-field-color').hide();
          $('div.chart-colors').show();
        }
        else {
          $('fieldset.chart-xaxis').show();
          $('fieldset.chart-yaxis').show();
          if (groupingField) {
            $('th.chart-field-color, td.chart-field-color').hide();
            $('div.chart-colors').show();
          }
          else {
            $('th.chart-field-color, td.chart-field-color').show();
            $('div.chart-colors').hide();
          }
        }
      }
    });

    // Set the initial values.
    $(this).find('input:radio:checked').triggerHandler('change');
  });

  // React to the setting of a group field.
  $(context).find('.charts-grouping-field').once('charts-grouping', function() {
    $(this).change(function() {
      $form = $(this).closest('form');

      // Hide the entire grouping field row, since no settings are applicable.
      var value = $(this).val();
      $form.find('#chart-fields tr').show();
      if (value) {
        var $labelField = $form.find('.chart-label-field input[value="' + value + '"]');
        $labelField.closest('tr').hide();
        if ($labelField.is(':checked')) {
          $form.find('input[name="style_options[label_field]"][value=""]').attr('checked', 'checked').triggerHandler('change');
        }
      }
      // Restripe the table after hiding/showing rows.
      $form.find('#chart-fields tr:visible')
        .removeClass('odd even')
        .filter(':even').addClass('odd').end()
        .filter(':odd').addClass('even');

      // Recalculate shown color fields by triggering the chart type change.
      $form.find('.form-radios.chart-type-radios input:radio:checked').triggerHandler('change');
    }).triggerHandler('change');
  });

  // Disable the data checkbox when a field is set as a label.
  $(context).find('td.chart-label-field input').once('charts-axis-inverted', function() {
    var $radio = $(this);
    $radio.change(function() {
      if ($radio.is(':checked')) {
        $('.chart-data-field input').show();
        $('.chart-field-color input').show();
        $('input.chart-field-disabled').remove();
        $radio.closest('tr').find('.chart-data-field input').hide().after('<input type="checkbox" name="chart_field_disabled" disabled="disabled" class="chart-field-disabled" />');
        $radio.closest('tr').find('.chart-field-color input').hide();
      }
    });
    $radio.triggerHandler('change');
  });

};

})(jQuery);;

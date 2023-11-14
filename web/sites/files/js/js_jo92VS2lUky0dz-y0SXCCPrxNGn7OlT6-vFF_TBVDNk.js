(function ($) {

/**
 * Attach handlers to evaluate the strength of any password fields and to check
 * that its confirmation is correct.
 */
Drupal.behaviors.password = {
  attach: function (context, settings) {
    var translate = settings.password;
    $('input.password-field', context).once('password', function () {
      var passwordInput = $(this);
      var innerWrapper = $(this).parent();
      var outerWrapper = $(this).parent().parent();

      // Add identifying class to password element parent.
      innerWrapper.addClass('password-parent');

      // Add the password confirmation layer.
      $('input.password-confirm', outerWrapper).parent().prepend('<div class="password-confirm">' + translate['confirmTitle'] + ' <span></span></div>').addClass('confirm-parent');
      var confirmInput = $('input.password-confirm', outerWrapper);
      var confirmResult = $('div.password-confirm', outerWrapper);
      var confirmChild = $('span', confirmResult);

      // Add the description box.
      var passwordMeter = '<div class="password-strength"><div class="password-strength-text" aria-live="assertive"></div><div class="password-strength-title">' + translate['strengthTitle'] + '</div><div class="password-indicator"><div class="indicator"></div></div></div>';
      $(confirmInput).parent().after('<div class="password-suggestions description"></div>');
      $(innerWrapper).prepend(passwordMeter);
      var passwordDescription = $('div.password-suggestions', outerWrapper).hide();

      // Check the password strength.
      var passwordCheck = function () {

        // Evaluate the password strength.
        var result = Drupal.evaluatePasswordStrength(passwordInput.val(), settings.password);

        // Update the suggestions for how to improve the password.
        if (passwordDescription.html() != result.message) {
          passwordDescription.html(result.message);
        }

        // Only show the description box if there is a weakness in the password.
        if (result.strength == 100) {
          passwordDescription.hide();
        }
        else {
          passwordDescription.show();
        }

        // Adjust the length of the strength indicator.
        $(innerWrapper).find('.indicator').css('width', result.strength + '%');

        // Update the strength indication text.
        $(innerWrapper).find('.password-strength-text').html(result.indicatorText);

        passwordCheckMatch();
      };

      // Check that password and confirmation inputs match.
      var passwordCheckMatch = function () {

        if (confirmInput.val()) {
          var success = passwordInput.val() === confirmInput.val();

          // Show the confirm result.
          confirmResult.css({ visibility: 'visible' });

          // Remove the previous styling if any exists.
          if (this.confirmClass) {
            confirmChild.removeClass(this.confirmClass);
          }

          // Fill in the success message and set the class accordingly.
          var confirmClass = success ? 'ok' : 'error';
          confirmChild.html(translate['confirm' + (success ? 'Success' : 'Failure')]).addClass(confirmClass);
          this.confirmClass = confirmClass;
        }
        else {
          confirmResult.css({ visibility: 'hidden' });
        }
      };

      // Monitor keyup and blur events.
      // Blur must be used because a mouse paste does not trigger keyup.
      passwordInput.keyup(passwordCheck).focus(passwordCheck).blur(passwordCheck);
      confirmInput.keyup(passwordCheckMatch).blur(passwordCheckMatch);
    });
  }
};

/**
 * Evaluate the strength of a user's password.
 *
 * Returns the estimated strength and the relevant output message.
 */
Drupal.evaluatePasswordStrength = function (password, translate) {
  password = $.trim(password);

  var weaknesses = 0, strength = 100, msg = [];

  var hasLowercase = /[a-z]+/.test(password);
  var hasUppercase = /[A-Z]+/.test(password);
  var hasNumbers = /[0-9]+/.test(password);
  var hasPunctuation = /[^a-zA-Z0-9]+/.test(password);

  // If there is a username edit box on the page, compare password to that, otherwise
  // use value from the database.
  var usernameBox = $('input.username');
  var username = (usernameBox.length > 0) ? usernameBox.val() : translate.username;

  // Lose 5 points for every character less than 6, plus a 30 point penalty.
  if (password.length < 6) {
    msg.push(translate.tooShort);
    strength -= ((6 - password.length) * 5) + 30;
  }

  // Count weaknesses.
  if (!hasLowercase) {
    msg.push(translate.addLowerCase);
    weaknesses++;
  }
  if (!hasUppercase) {
    msg.push(translate.addUpperCase);
    weaknesses++;
  }
  if (!hasNumbers) {
    msg.push(translate.addNumbers);
    weaknesses++;
  }
  if (!hasPunctuation) {
    msg.push(translate.addPunctuation);
    weaknesses++;
  }

  // Apply penalty for each weakness (balanced against length penalty).
  switch (weaknesses) {
    case 1:
      strength -= 12.5;
      break;

    case 2:
      strength -= 25;
      break;

    case 3:
      strength -= 40;
      break;

    case 4:
      strength -= 40;
      break;
  }

  // Check if password is the same as the username.
  if (password !== '' && password.toLowerCase() === username.toLowerCase()) {
    msg.push(translate.sameAsUsername);
    // Passwords the same as username are always very weak.
    strength = 5;
  }

  // Based on the strength, work out what text should be shown by the password strength meter.
  if (strength < 60) {
    indicatorText = translate.weak;
  } else if (strength < 70) {
    indicatorText = translate.fair;
  } else if (strength < 80) {
    indicatorText = translate.good;
  } else if (strength <= 100) {
    indicatorText = translate.strong;
  }

  // Assemble the final message.
  msg = translate.hasWeaknesses + '<ul><li>' + msg.join('</li><li>') + '</li></ul>';
  return { strength: strength, message: msg, indicatorText: indicatorText };

};

/**
 * Field instance settings screen: force the 'Display on registration form'
 * checkbox checked whenever 'Required' is checked.
 */
Drupal.behaviors.fieldUserRegistration = {
  attach: function (context, settings) {
    var $checkbox = $('form#field-ui-field-edit-form input#edit-instance-settings-user-register-form');

    if ($checkbox.length) {
      $('input#edit-instance-required', context).once('user-register-form-checkbox', function () {
        $(this).bind('change', function (e) {
          if ($(this).attr('checked')) {
            $checkbox.attr('checked', true);
          }
        });
      });

    }
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

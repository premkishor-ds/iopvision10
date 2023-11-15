(function ($, Drupal) {
    Drupal.behaviors.customBehavior = {
      attach: function (context, settings) {
        $('#customButton', context).once('customButtonBehavior').on('click', function () {
          console.log('Button clicked!');
        });
      }
    };
  })(jQuery, Drupal);
  
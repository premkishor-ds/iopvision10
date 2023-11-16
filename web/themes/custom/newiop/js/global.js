/**
 * @file
 * Global utilities.
 *
 */
(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.iop = {
    attach: function (context, settings) {

    }
  };
  
  jQuery(window).scroll(function () {
    var scroll = jQuery(window).scrollTop();
    if (scroll >= 150) {
       jQuery("body").addClass("sticky");
    } else {
       jQuery("body").removeClass("sticky");
    }
 }); 
 // popup VA
jQuery(".popupbox img").click(function () {
	
	jQuery(".showpopup").fadeIn();
   jQuery(".img-show img").attr("src", jQuery(this).attr("src"));
});

jQuery("span, .overlay").click(function () {
	jQuery(".showpopup").fadeOut();
});


// VA
jQuery(function () {
            $("#edit-sort-by").on("change keyup", function () {
                $("#views-exposed-form-library-page").submit();
            });
        });
		
})(jQuery, Drupal);

<?php

namespace Drupal\hello_world\Controller;

class HelloWorldController {
    public function message() {
        return [
            '#markup' => 'Hello World Message'
        ];
    }
}
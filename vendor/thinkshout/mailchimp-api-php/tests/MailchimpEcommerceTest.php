<?php

namespace Mailchimp\Tests;

use PHPUnit\Framework\TestCase;

/**
 * Mailchimp Ecommerce test library.
 *
 * @package Mailchimp\Tests
 */
class MailchimpEcommerceTest extends TestCase {

  /**
   * Tests library functionality for stores information.
   */
  public function testGetStores() {
    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getStores();

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores', $mc->getClient()->uri);
  }

  /**
   * Tests library functionality for store information.
   */
  public function testGetStore() {
    $store_id = 'MC002';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getStore($store_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for adding a new store.
   */
  public function testAddStore() {
    $id = 'MC001';
    $store = [
      'list_id' => '205d96e6b4',
      'name' => "Freddie's Merchandise",
      'currency_code' => 'USD',
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addStore($id, $store);

    $this->assertEquals('POST', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores', $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($id, $request_body->id);
    $this->assertEquals($store['list_id'], $request_body->list_id);
    $this->assertEquals($store['name'], $request_body->name);
    $this->assertEquals($store['currency_code'], $request_body->currency_code);
  }

  /**
   * Tests library functionality for updating a store.
   */
  public function testUpdateStore() {
    $store_id = 'MC001';
    $name = "Freddie's Merchandise";
    $currency_code = 'USD';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updateStore($store_id, $name, $currency_code);

    $this->assertEquals('PATCH', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id, $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($name, $request_body->name);
    $this->assertEquals($currency_code, $request_body->currency_code);
  }

  /**
   * Tests library functionality for deleting stores.
   */
  public function testDeleteStore() {
    $store_id = 'MC002';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deleteStore($store_id);

    $this->assertEquals('DELETE', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id, $mc->getClient()->uri);
  }

  /**
   * Tests library functionality for getting information on a store's carts.
   */
  public function testGetCarts() {
    $store_id = 'MC001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getCarts($store_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts', $mc->getClient()->uri);
  }

  /**
   * Tests library functionality for getting information on a specific cart.
   */
  public function testGetCart() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getCart($store_id, $cart_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for adding a new cart.
   */
  public function testAddCart() {
    $store_id = 'MC001';
    $id = 'cart0001';
    $customer = [
      'id' => 'cust0005',
      'email_address' => 'freddy@freddiesjokes.com',
      'opt_in_status' => TRUE,
    ];
    $cart = [
      'currency_code' => 'USD',
      'order_total' => 12.45,
      'lines' => [
        'id' => 'LINE001',
        'product_id' => 'PROD001',
        'product_title' => "Freddie's Jokes",
        'product_variant_id' => 'PROD001A',
        'product_variant_title' => "Freddie's Jokes Volume 1",
        'quantity' => 2,
        'price' => 10,
      ],
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addCart($store_id, $id, $customer, $cart);

    $this->assertEquals('POST', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts', $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($id, $request_body->id);
    $this->assertEquals($customer['id'], $request_body->customer->id);
    $this->assertEquals($customer['email_address'], $request_body->customer->email_address);
    $this->assertEquals($customer['opt_in_status'], $request_body->customer->opt_in_status);
    $this->assertEquals($cart['currency_code'], $request_body->currency_code);
    $this->assertEquals($cart['order_total'], $request_body->order_total);
    $this->assertEquals($cart['lines'], $request_body->lines);
    $this->assertEquals($cart['lines']['id'], $request_body->lines['id']);
    $this->assertEquals($cart['lines']['product_id'], $request_body->lines['product_id']);
    $this->assertEquals($cart['lines']['product_title'], $request_body->lines['product_title']);
    $this->assertEquals($cart['lines']['product_variant_id'], $request_body->lines['product_variant_id']);
    $this->assertEquals($cart['lines']['product_variant_title'], $request_body->lines['product_variant_title']);
    $this->assertEquals($cart['lines']['quantity'], $request_body->lines['quantity']);
    $this->assertEquals($cart['lines']['price'], $request_body->lines['price']);
  }

  /**
   * Tests library function for updating an existing cart.
   */
  public function testUpdateCart() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updateCart($store_id, $cart_id);

    $this->assertEquals('PATCH', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for deleting a cart.
   */
  public function testDeleteCart() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deleteCart($store_id, $cart_id);

    $this->assertEquals('DELETE', $mc->getClient()->method);
    $this->assertEquals($mc->getEndPoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting cart lines.
   */
  public function testGetCartLines() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getCartLines($store_id, $cart_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id . '/lines', $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting a specific cart's line item.
   */
  public function testGetCartLine() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';
    $line_id = 'line002';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getCartLine($store_id, $cart_id, $line_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id . '/lines/' . $line_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for adding a line item to a cart.
   */
  public function testAddCartLine() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';
    $id = 'L001';
    $product = [
      'product_id' => 'PROD001',
      'product_variant_id' => "Freddie's Jokes",
      'quantity' => 1,
      'price' => 5,
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addCartLine($store_id, $cart_id, $id, $product);

    $this->assertEquals('POST', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id . '/lines', $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($id, $request_body->id);
    $this->assertEquals($product['product_id'], $request_body->product_id);
    $this->assertEquals($product['product_variant_id'], $request_body->product_variant_id);
    $this->assertEquals($product['quantity'], $request_body->quantity);
    $this->assertEquals($product['price'], $request_body->price);
  }

  /**
   * Tests library function for updating a cart line item.
   */
  public function testUpdateCartLine() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';
    $line_id = 'L001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updateCartLine($store_id, $cart_id, $line_id);

    $this->assertEquals('PATCH', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id . '/lines/' . $line_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for deleting a cart line item.
   */
  public function testDeleteCartLine() {
    $store_id = 'MC001';
    $cart_id = 'cart0001';
    $line_id = 'L001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deleteCartLine($store_id, $cart_id, $line_id);

    $this->assertEquals('DELETE', $mc->getClient()->method);
    $this->assertEquals($mc->getEndPoint() . '/ecommerce/stores/' . $store_id . '/carts/' . $cart_id . '/lines/' . $line_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting customers.
   */
  public function testGetCustomers() {
    $store_id = 'MC001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getCustomers($store_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndPoint() . '/ecommerce/stores/' . $store_id . '/customers', $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting a customer.
   */
  public function testGetCustomer() {
    $store_id = 'MC001';
    $customer_id = 'cust0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getCustomer($store_id, $customer_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/customers/' . $customer_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for adding a customer.
   */
  public function testAddCustomer() {
    $store_id = 'MC001';
    $customer = [
      'id' => 'cust0001',
      'email_address' => 'freddie@freddiesjokes.com',
      'opt_in_status' => TRUE,
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addCustomer($store_id, $customer);

    $this->assertEquals('POST', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/customers', $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($customer['id'], $request_body->id);
    $this->assertEquals($customer['email_address'], $request_body->email_address);
    $this->assertEquals($customer['opt_in_status'], $request_body->opt_in_status);
  }

  /**
   * Tests library function for updating a customer.
   */
  public function testUpdateCustomer() {
    $store_id = 'MC001';
    $customer = [
      'id' => 'cust0001',
      'email_address' => 'freddie@freddiesjokes.com',
      'opt_in_status' => TRUE,
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updateCustomer($store_id, $customer);

    $this->assertEquals('PATCH', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/customers/' . $customer['id'], $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($customer['id'], $request_body->id);
    $this->assertEquals($customer['email_address'], $request_body->email_address);
    $this->assertEquals($customer['opt_in_status'], $request_body->opt_in_status);
  }

  /**
   * Tests library function for deleting a customer.
   */
  public function testDeleteCustomer() {
    $store_id = 'MC001';
    $customer_id = 'cust0003';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deleteCustomer($store_id, $customer_id);

    $this->assertEquals('DELETE', $mc->getClient()->method);
    $this->assertEquals($mc->getEndPoint() . '/ecommerce/stores/' . $store_id . '/customers/' . $customer_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting orders.
   */
  public function testGetOrders() {
    $store_id = 'MC001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getOrders($store_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/orders', $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting an order.
   */
  public function testGetOrder() {
    $store_id = 'MC001';
    $order_id = 'ord0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getOrder($store_id, $order_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/orders/' . $order_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for adding an order.
   */
  public function testAddOrder() {
    $store_id = 'MC001';
    $order_id = 'ord0001';
    $customer = [
      'id' => 'cust0005',
      'email_address' => 'freddy@freddiesjokes.com',
      'opt_in_status' => TRUE,
    ];
    $order = [
      'currency_code' => 'USD',
      'order_total' => 12.45,
      'lines' => [
        'id' => 'LINE001',
        'product_id' => 'PROD001',
        'product_title' => "Freddie's Jokes",
        'product_variant_id' => 'PROD001A',
        'product_variant_title' => "Freddie's Jokes Volume 1",
        'quantity' => 2,
        'price' => 10,
      ],
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addOrder($store_id, $order_id, $customer, $order);

    $this->assertEquals('POST', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/orders', $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($order_id, $request_body->id);
    $this->assertEquals($customer['id'], $request_body->customer->id);
    $this->assertEquals($customer['email_address'], $request_body->customer->email_address);
    $this->assertEquals($customer['opt_in_status'], $request_body->customer->opt_in_status);
    $this->assertEquals($order['currency_code'], $request_body->currency_code);
    $this->assertEquals($order['order_total'], $request_body->order_total);
    $this->assertEquals($order['lines'], $request_body->lines);
    $this->assertEquals($order['lines']['id'], $request_body->lines['id']);
    $this->assertEquals($order['lines']['product_id'], $request_body->lines['product_id']);
    $this->assertEquals($order['lines']['product_title'], $request_body->lines['product_title']);
    $this->assertEquals($order['lines']['product_variant_id'], $request_body->lines['product_variant_id']);
    $this->assertEquals($order['lines']['product_variant_title'], $request_body->lines['product_variant_title']);
    $this->assertEquals($order['lines']['quantity'], $request_body->lines['quantity']);
    $this->assertEquals($order['lines']['price'], $request_body->lines['price']);
  }

  /**
   * Tests library function for updating an order.
   */
  public function testUpdateOrder() {
    $store_id = 'MC001';
    $order_id = 'ord0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updateOrder($store_id, $order_id);

    $this->assertEquals('PATCH', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/orders/' . $order_id, $mc->getClient()->uri);
  }

  /**
   * Tests library functionality for deleting an order.
   */
  public function testDeleteOrder() {
    $store_id = 'MC002';
    $order_id = 'ord0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deleteOrder($store_id, $order_id);

    $this->assertEquals('DELETE', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/orders/' . $order_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting order lines.
   */
  public function testGetOrderLines() {
    $store_id = 'MC001';
    $order_id = 'ord0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getOrderLines($store_id, $order_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndPoint() . '/ecommerce/stores/' . $store_id . '/orders/' . $order_id . '/lines', $mc->getClient()->uri);
  }

  /**
   * Tests library function for getting order lines.
   */
  public function testGetOrderLine() {
    $store_id = 'MC001';
    $order_id = 'ord0001';
    $line_id = 'L001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getOrderLine($store_id, $order_id, $line_id);

    $this->assertEquals('GET', $mc->getClient()->method);
    $this->assertEquals($mc->getEndPoint() . '/ecommerce/stores/' . $store_id . '/orders/' . $order_id . '/lines/' . $line_id, $mc->getClient()->uri);
  }

  /**
   * Tests library function for adding an order line.
   */
  public function testAddOrderLine() {
    $store_id = 'MC001';
    $order_id = 'ord0001';
    $id = 'L002';
    $product = [
      'product_id' => 'PROD001',
      'product_variant_id' => "Freddie's Jokes",
      'quantity' => 1,
      'price' => 5,
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addOrderLine($store_id, $order_id, $id, $product);

    $this->assertEquals('POST', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/orders/' . $order_id . '/lines', $mc->getClient()->uri);

    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($id, $request_body->id);
    $this->assertEquals($product['product_id'], $request_body->product_id);
    $this->assertEquals($product['product_variant_id'], $request_body->product_variant_id);
    $this->assertEquals($product['quantity'], $request_body->quantity);
    $this->assertEquals($product['price'], $request_body->price);
  }

  /**
   * Test getting all products.
   */
  public function testsGetProducts() {
    $store_id = 'MC001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getProducts($store_id);
    // Method must be GET.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Confirm the URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products', $mc->getClient()->uri);
  }

  /**
   * Test getting information on a single product.
   */
  public function testGetProduct() {
    $store_id = 'MC001';
    $product_id = 'sku0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getProduct($store_id, $product_id);
    // Method must be GET.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Confirm the URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $product_id, $mc->getClient()->uri);
  }

  /**
   * Test adding a product.
   */
  public function testAddProduct() {
    $store_id = 'MC001';
    $id = 'sku0001';
    $title = 'Test Product 001';
    $url = 'http://example.org/';
    $variant_1 = (object) [
      'id' => 'PROD001A',
      'title' => "Freddie's Jokes Volume 1",
    ];
    $variants = [
      $variant_1,
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);

    $mc->addProduct($store_id, $id, $title, $url, $variants);
    $this->assertEquals('POST', $mc->getClient()->method);

    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products', $mc->getClient()->uri);
    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($id, $request_body->id);
    $this->assertEquals($title, $request_body->title);
    $this->assertEquals($variant_1->id, $request_body->variants[0]->id);
    $this->assertEquals($variant_1->title, $request_body->variants[0]->title);
  }

  /**
   * Test updating a product.
   */
  public function testUpdateProduct() {
    $store_id = 'MC001';
    $id = 'sku0001';
    $variant_1 = (object) [
      'id' => 'PROD001A',
      'title' => "Freddie's Jokes Volume 1",
    ];
    $variant_2 = (object) [
      'id' => 'PROD002A',
      'title' => "Freddie's Jokes Volume 2",
    ];
    $variants = [
      $variant_1,
      $variant_2,
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);

    $mc->updateProduct($store_id, $id, $variants);
    $this->assertEquals('PATCH', $mc->getClient()->method);

    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $id, $mc->getClient()->uri);
    $this->assertNotEmpty($mc->getClient()->options['json']);

    $request_body = $mc->getClient()->options['json'];

    $this->assertEquals($variant_1->id, $request_body->variants[0]->id);
    $this->assertEquals($variant_1->title, $request_body->variants[0]->title);
    $this->assertEquals($variant_2->id, $request_body->variants[1]->id);
    $this->assertEquals($variant_2->title, $request_body->variants[1]->title);
  }

  /**
   * Test deleting a product.
   */
  public function testDeleteProduct() {
    $store_id = 'MC001';
    $product_id = 'sku0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deleteProduct($store_id, $product_id);
    // Method must be DELETE.
    $this->assertEquals('DELETE', $mc->getClient()->method);
    // Confirm URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $product_id, $mc->getClient()->uri);
  }

  /**
   * Test adding a product variant.
   */
  public function testAddProductVariant() {
    $store_id = 'MC001';
    $product_id = 'sku0001';
    $params = [
      'id' => 'var001',
      'title' => 'Var Title',
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addProductVariant($store_id, $product_id, $params);
    $this->assertEquals('POST', $mc->getClient()->method);
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $product_id . '/variants', $mc->getClient()->uri);
    $this->assertNotEmpty($mc->getClient()->options['json']);
    $request_body = $mc->getClient()->options['json'];
    $this->assertEquals($params['id'], $request_body->id);
    $this->assertEquals($params['title'], $request_body->title);
  }

  /**
   * Test deleting a variant.
   */
  public function testDeleteVariant() {
    $store_id = 'MC001';
    $product_id = 'sku0001';
    $variant_id = 'var001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deleteProductVariant($store_id, $product_id, $variant_id);
    // Confirm we are using DELETE in the client method.
    $this->assertEquals('DELETE', $mc->getClient()->method);
    // Confirm URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $product_id . '/variants/' . $variant_id, $mc->getClient()->uri);
  }

  /**
   * Test getting a single variant of a single product.
   */
  public function testGetVariant() {
    $store_id = 'MC001';
    $product_id = 'sku0001';
    $variant_id = 'var001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getProductVariant($store_id, $product_id, $variant_id);
    // Check method.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $product_id . '/variants/' . $variant_id, $mc->getClient()->uri);
  }

  /**
   * Test getting all variants for a single product.
   */
  public function testGetVariants() {
    $store_id = 'MC001';
    $product_id = 'sku0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getProductVariants($store_id, $product_id);
    // Check method.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $product_id . '/variants', $mc->getClient()->uri);

  }

  /**
   * Test updating a variant.
   */
  public function testUpdateVariant() {
    $store_id = 'MC001';
    $product_id = 'sku0001';
    $variant_id = 'var001';
    $params = [
      'title' => 'New Title',
      'url' => 'http://www.example.com',
      'sku' => 'abc0042',
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updateProductVariant($store_id, $product_id, $variant_id, $params);
    // Check method.
    $this->assertEquals('PATCH', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/products/' . $product_id . '/variants/' . $variant_id, $mc->getClient()->uri);
    // Test the contents of the body of the request for the params.
    $this->assertNotEmpty($mc->getClient()->options['json']);
    $request_body = $mc->getClient()->options['json'];
    $this->assertEquals($params['url'], $request_body->url);
    $this->assertEquals($params['title'], $request_body->title);
    $this->assertEquals($params['sku'], $request_body->sku);
  }


  /**
   * Tests creating a promo rule
   */
  public function testAddPromoRule() {
    $store_id = 'MC001';
    $params = [
      'id' => 'promo0001',
      'description' => 'Test promotion rule',
      'amount' => '10.00',
      'type' => 'fixed',
      'target' => 'total',
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addPromoRule($store_id, $params);
    // Check method.
    $this->assertEquals('POST', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules', $mc->getClient()->uri);
    // Test the contents of the body of the request for the params.
    $this->assertNotEmpty($mc->getClient()->options['json']);
    $request_body = $mc->getClient()->options['json'];
    $this->assertEquals($params['id'], $request_body->id);
    $this->assertEquals($params['description'], $request_body->description);
    $this->assertEquals($params['amount'], $request_body->amount);
    $this->assertEquals($params['type'], $request_body->type);
    $this->assertEquals($params['target'], $request_body->target);
  }

  /**
   * Tests updating a promo rule
   */
  public function testUpdatePromoRule() {
    $store_id = 'MC001';
    $params = [
      'id' => 'promo0001',
      'description' => 'New description',
      'amount' => '11',
      'type' => 'percentage',
      'target' => 'per_item',
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updatePromoRule($store_id, $params);
    // Check method.
    $this->assertEquals('PATCH', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $params['id'], $mc->getClient()->uri);
    // Test the contents of the body of the request for the params.
    $this->assertNotEmpty($mc->getClient()->options['json']);
    $request_body = $mc->getClient()->options['json'];
    $this->assertEquals($params['id'], $request_body->id);
    $this->assertEquals($params['description'], $request_body->description);
    $this->assertEquals($params['amount'], $request_body->amount);
    $this->assertEquals($params['type'], $request_body->type);
    $this->assertEquals($params['target'], $request_body->target);
  }

  /**
   * Tests getting promo rules
   */
  public function testGetPromoRules() {
    $store_id = 'MC001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getPromoRules($store_id);
    // Check method.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules', $mc->getClient()->uri);
  }

  /**
   * Tests getting a promo rule
   */
  public function testGetPromoRule() {
    $store_id = 'MC001';
    $promo_rule_id = 'promo0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getPromoRule($store_id, $promo_rule_id);
    // Check method.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $promo_rule_id, $mc->getClient()->uri);
  }

  /**
   * Tests deleting a promo rule
   */
  public function testDeletePromoRule() {
    $store_id = 'MC001';
    $promo_rule_id = 'promo0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deletePromoRule($store_id, $promo_rule_id);
    // Method must be DELETE.
    $this->assertEquals('DELETE', $mc->getClient()->method);
    // Confirm URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $promo_rule_id, $mc->getClient()->uri);
  }

  /**
   * Tests creating a promo code
   */
  public function testAddPromoCode() {
    $store_id = 'MC001';
    $promo_rule_id = 'promo0001';
    $promo_code_id = 'code001';
    $params = [
      'id' => 'code001',
      'code' => 'abc0042',
      'redemption_url' => 'http://www.example.com',
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->addPromoCode($store_id, $promo_rule_id, $params);
    // Check method.
    $this->assertEquals('POST', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $promo_rule_id . '/promo-codes', $mc->getClient()->uri);
    // Test the contents of the body of the request for the params.
    $this->assertNotEmpty($mc->getClient()->options['json']);
    $request_body = $mc->getClient()->options['json'];
    $this->assertEquals($params['id'], $request_body->id);
    $this->assertEquals($params['code'], $request_body->code);
    $this->assertEquals($params['redemption_url'], $request_body->redemption_url);  }

  /**
   * Tests updating a promo code
   */
  public function testUpdatePromoCode() {
    $store_id = 'MC001';
    $promo_rule_id = 'promo0001';
    $params = [
      'id' => 'code001',
      'code' => 'abc0042',
      'redemption_url' => 'http://www.example.com',
    ];

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->updatePromoCode($store_id, $promo_rule_id, $params);
    // Check method.
    $this->assertEquals('PATCH', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $promo_rule_id . '/promo-codes/' . $params['id'], $mc->getClient()->uri);
    // Test the contents of the body of the request for the params.
    $this->assertNotEmpty($mc->getClient()->options['json']);
    $request_body = $mc->getClient()->options['json'];
    $this->assertEquals($params['id'], $request_body->id);
    $this->assertEquals($params['code'], $request_body->code);
    $this->assertEquals($params['redemption_url'], $request_body->redemption_url);
  }

  /**
   * Tests getting promo codes
   */
  public function testGetPromoCodes() {
    $store_id = 'MC001';
    $promo_rule_id = 'promo0001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getPromoCodes($store_id, $promo_rule_id);
    // Check method.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $promo_rule_id . '/promo-codes', $mc->getClient()->uri);
  }

  /**
   * Tests getting a promo code
   */
  public function testGetPromoCode() {
    $store_id = 'MC001';
    $promo_rule_id = 'promo0001';
    $promo_code_id = 'code001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->getPromoCode($store_id, $promo_rule_id, $promo_code_id);
    // Check method.
    $this->assertEquals('GET', $mc->getClient()->method);
    // Check URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $promo_rule_id . '/promo-codes/' . $promo_code_id, $mc->getClient()->uri);
  }

  /**
   * Tests deleting a promo code
   */
  public function testDeletePromoCode() {
    $store_id = 'MC001';
    $promo_rule_id = 'promo0001';
    $promo_code_id = 'code001';

    $api_user = new Mailchimp(['api_user' => null, 'api_key' => null]);
    $mc = new MailchimpEcommerce($api_user);
    $mc->deletePromoCode($store_id, $promo_rule_id, $promo_code_id);
    // Method must be DELETE.
    $this->assertEquals('DELETE', $mc->getClient()->method);
    // Confirm URI being used.
    $this->assertEquals($mc->getEndpoint() . '/ecommerce/stores/' . $store_id . '/promo-rules/' . $promo_rule_id . '/promo-codes/' . $promo_code_id, $mc->getClient()->uri);
  }

}

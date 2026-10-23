<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_dashboard_uses_the_script_element_for_the_initial_page(): void
    {
        $response = $this->get('/dashboard');

        $response->assertOk();
        $response->assertSee('<script data-page="app" type="application/json">', false);
        $response->assertSee('"component":"Dashboard"', false);
    }
}

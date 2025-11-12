Feature: Shop Screen

  Scenario: User can view shop screen
    When I navigate to Shop tab
    Then I should see "Shop" text
    And I should see the search bar

  Scenario: User can search for products
    When I navigate to Shop tab
    And I enter "shirt" in the search bar
    And I wait for search results
    Then I should see product results
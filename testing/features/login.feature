Feature: Fitness App Login
  
  Scenario: User can login with valid credentials
    Given I open the app
    When I tap on "LOG IN" button
    And I enter my test email
    And I enter my test password
    And I tap the login submit button
    Then I should see the home screen
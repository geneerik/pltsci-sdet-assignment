@issue:99
Feature: Cleaning Session Service (basic)
  To ensure the cleaning service is up and capable of performing basic cleaning operations with nominal input

  Background:
    Given I have freshly started hoover web server instance

  Scenario: Nothing to clean
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have no dirt to clean
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 1 width units and 3 height units

  Scenario: service is running example
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 1
    And I should see a hoover at coordinates 1 width units and 3 height units

  @issue:5 @issue:6 @issue:5 @issue:7
  Scenario: a
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have no dirt to clean
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 1 width units and 3 height units

  Scenario: b
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 1
    And I should see a hoover at coordinates 1 width units and 3 height units
Feature: Cleaning Session Service (reuse server instance)
  To ensure the cleaning service is performs as expected after handling previous data

  Background:
    Given I have freshly started hoover web server instance
    And I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 1
    And I should see a hoover at coordinates 1 width units and 3 height units

  Scenario: No move instructions after previous pickup
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have no dirt to clean
    When I give no cleaning instructions
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 1 width units and 2 height units

  @issue:2
  Scenario: No patches covered after previous pickup
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      4      |       4      |
      |      3      |       4      |
      |      4      |       3      |
    When I give cleaning instructions to move ESSWW
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 0 width units and 0 height units

  Scenario: New patches covered after previous pickup
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 2 width units and 4 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      4      |       4      |
      |      3      |       4      |
      |      4      |       3      |
    When I give cleaning instructions to move EEES
    Then I should see that total number of clean spots is 3
    And I should see a hoover at coordinates 4 width units and 3 height units
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

  Scenario: No move instructions
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give no cleaning instructions
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 1 width units and 2 height units

  @issue:1
  Scenario: Starts on a patch with no move instructions
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       2      |
      |      2      |       2      |
      |      2      |       3      |
    When I give no cleaning instructions
    Then I should see that total number of clean spots is 1
    And I should see a hoover at coordinates 1 width units and 2 height units

  Scenario: starts on patch
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       2      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 1
    And I should see a hoover at coordinates 1 width units and 3 height units

  Scenario: multiple pickups
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       3      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 2
    And I should see a hoover at coordinates 1 width units and 3 height units

  Scenario: Revisting already cleaned spots
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWWSNNESEESWNWW
    Then I should see that total number of clean spots is 1
    And I should see a hoover at coordinates 1 width units and 3 height units

  Scenario: No patches covered
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      4      |       4      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 1 width units and 3 height units

  Scenario: Tiny room
    Given I have a room with 1 width units and 1 height units
    And I have a hoover at coordinates 0 width units and 0 height units
    And I have no dirt to clean
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 0 width units and 0 height units

  Scenario: Hit north wall
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 0 width units and 0 height units
    And I have no dirt to clean
    When I give cleaning instructions to move NNNNN
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 0 width units and 4 height units

  Scenario: Hit east wall
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 0 width units and 0 height units
    And I have no dirt to clean
    When I give cleaning instructions to move EEEEE
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 4 width units and 0 height units

  Scenario: Hit south wall
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 4 width units and 4 height units
    And I have no dirt to clean
    When I give cleaning instructions to move SSSSS
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 4 width units and 0 height units

  Scenario: Hit west wall
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 4 width units and 4 height units
    And I have no dirt to clean
    When I give cleaning instructions to move WWWWW
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 0 width units and 4 height units

  Scenario: Hit southwest corner
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 4 width units and 4 height units
    And I have no dirt to clean
    When I give cleaning instructions to move WWWWWSSSSS
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 0 width units and 0 height units

  Scenario: Hit northeast corner
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 0 width units and 0 height units
    And I have no dirt to clean
    When I give cleaning instructions to move EEEEENNNNN
    Then I should see that total number of clean spots is 0
    And I should see a hoover at coordinates 4 width units and 4 height units
Feature: Cleaning Session Service (basic)
  Placeholder

  Scenario: service is running example
    Given I have a hoover at coordinates 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean a some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see that total number of clean spots is 2
    And I should see a hoover at coordinates 1 width units and 3 height units

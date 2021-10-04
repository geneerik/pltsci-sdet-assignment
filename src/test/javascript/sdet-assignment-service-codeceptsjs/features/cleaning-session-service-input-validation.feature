Feature: Cleaning Session Service (Input validation)
  To ensure the cleaning service can handle incorrect input values

  Background:
    Given I have freshly started hoover web server instance

  Scenario Outline: invalid room size values
    Given I supply raw room size parameter values of <x> width units and <y> height units
    And I have known issues "<known_issues>"
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see a response from the server indicating it handled an error

    Examples:
      |     x     |     y     | known_issues |
      |    -1     |     5     |      6       |
      |    -10    |     5     |      6       |
      |     0     |     5     |      6       |
      |    "a"    |     5     |              |
      |   "aa"    |     5     |              |
      |    ""     |     5     |      6       |
      |   true    |     5     |              |
      |   false   |     5     |              |
      |   null    |     5     |      6       |
      |    0.1    |     5     |      6       |
      |    {}     |     5     |              |
      | {"a":"b"} |     5     |              |
      |    []     |     5     |              |
      |    [1]    |     5     |              |
      |     5     |    -1     |      7       |
      |     5     |    -10    |      7       |
      |     5     |     0     |      5       |
      |     5     |    "a"    |              |
      |     5     |   "aa"    |              |
      |     5     |    ""     |      5       |
      |     5     |   true    |              |
      |     5     |   false   |              |
      |     5     |   null    |      5       |
      |     5     |    0.1    |      5       |
      |     5     |    {}     |              |
      |     5     | {"a":"b"} |              |
      |     5     |    []     |              |
      |     5     |    [1]    |              |
      |     5     | 9999999999999999999999999999999999999999999999999999999999999999999999999999 |              |
      | 9999999999999999999999999999999999999999999999999999999999999999999999999999 | 5 |              |

  Scenario Outline: invalid hoover start position values
    Given I have a room with 15 width units and 15 height units
    And I have known issues "<known_issues>"
    And I supply raw hoover coordinates parameter values of <x> width units and <y> height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      2      |       2      |
      |      2      |       3      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see a response from the server indicating it handled an error

    Examples:
      |     x     |     y     | known_issues |
      |    -1     |     5     |      8       |
      |    -10    |     5     |      9       |
      |     0     |     5     |      9       |
      |    "a"    |     5     |              |
      |   "aa"    |     5     |              |
      |    ""     |     5     |      9       |
      |   true    |     5     |              |
      |   false   |     5     |              |
      |   null    |     5     |      9       |
      |    0.1    |     5     |      9       |
      |    {}     |     5     |              |
      | {"a":"b"} |     5     |              |
      |    []     |     5     |              |
      |    [1]    |     5     |              |
      |     5     |    -1     |      10      |
      |     5     |    -10    |      10      |
      |     5     |     0     |      10      |
      |     5     |    "a"    |              |
      |     5     |   "aa"    |              |
      |     5     |    ""     |      10      |
      |     5     |   true    |              |
      |     5     |   false   |              |
      |     5     |   null    |      10      |
      |     5     |    0.1    |      10      |
      |     5     |    {}     |              |
      |     5     | {"a":"b"} |              |
      |     5     |    []     |              |
      |     5     |    [1]    |              |
      |     5     | 9999999999999999999999999999999999999999999999999999999999999999999999999999 |              |
      | 9999999999999999999999999999999999999999999999999999999999999999999999999999 | 5 |              |

  Scenario Outline: invalid dirt patch position values
    Given I have a room with 15 width units and 15 height units
    And I have known issues "<known_issues>"
    And I have a hoover at coordinates 1 width units and 2 height units
    And I supply some raw dirt patch coordinates parameter values of <x> width units and <y> height units
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see a response from the server indicating it handled an error

    Examples:
      |     x     |     y     | known_issues |
      |    -1     |     5     |              |
      |    -10    |     5     |              |
      |     0     |     5     |              |
      |    "a"    |     5     |              |
      |   "aa"    |     5     |              |
      |    ""     |     5     |      3       |
      |   true    |     5     |              |
      |   false   |     5     |              |
      |   null    |     5     |      3       |
      |    0.1    |     5     |              |
      |    {}     |     5     |              |
      | {"a":"b"} |     5     |              |
      |    []     |     5     |              |
      |    [1]    |     5     |              |
      |     5     |    -1     |              |
      |     5     |    -10    |              |
      |     5     |     0     |              |
      |     5     |    "a"    |              |
      |     5     |   "aa"    |              |
      |     5     |    ""     |      3       |
      |     5     |   true    |              |
      |     5     |   false   |              |
      |     5     |   null    |      3       |
      |     5     |    0.1    |              |
      |     5     |    {}     |              |
      |     5     | {"a":"b"} |              |
      |     5     |    []     |              |
      |     5     |    [1]    |              |
      |     5     | 9999999999999999999999999999999999999999999999999999999999999999999999999999 |              |
      | 9999999999999999999999999999999999999999999999999999999999999999999999999999 | 5 |              |

  @issue:4
  Scenario: duplicate dirt patch positions
    Given I have a room with 5 width units and 5 height units
    And I have a hoover at coordinates 1 width units and 2 height units
    And I have dirt to clean at some coordinates
      | width_units | height_units |
      |      1      |       0      |
      |      1      |       0      |
    When I give cleaning instructions to move NNESEESWNWW
    Then I should see a response from the server indicating it handled an error
/**
 * Application Constants
 */

export const RESPONSE_FIELDS = {
  UNDERSTANDING: 'understanding',
  BRUTE_FORCE: 'brute_force',
  OPTIMIZED: 'optimized',
  TIME_COMPLEXITY: 'time_complexity',
  SPACE_COMPLEXITY: 'space_complexity',
  EDGE_CASES: 'edge_cases',
  JAVA_CODE: 'java_code',
  DRY_RUN: 'dry_run',
  FOLLOW_UP_QUESTIONS: 'follow_up_questions',
  COMMON_MISTAKES: 'common_mistakes',
  VARIATIONS: 'variations'
};

export const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

export const DSA_CATEGORIES = [
  'Array',
  'String',
  'LinkedList',
  'Stack',
  'Queue',
  'Tree',
  'Graph',
  'DynamicProgramming',
  'Greedy',
  'Backtracking',
  'BinarySearch',
  'TwoPointers',
  'SlidingWindow',
  'HashMap',
  'Heap',
  'Trie',
  'UnionFind',
  'BitManipulation',
  'Math',
  'Recursion'
];

export const COMPLEXITY_TYPES = {
  CONSTANT: 'O(1)',
  LOGARITHMIC: 'O(log n)',
  LINEAR: 'O(n)',
  LINEARITHMIC: 'O(n log n)',
  QUADRATIC: 'O(n²)',
  CUBIC: 'O(n³)',
  EXPONENTIAL: 'O(2^n)',
  FACTORIAL: 'O(n!)'
};

export const INTERVIEW_MODE = {
  KEYWORD: 'interview mode',
  MAX_GUIDED_QUESTIONS: 3,
  PHASES: {
    UNDERSTANDING: 'understanding',
    APPROACH: 'approach',
    OPTIMIZATION: 'optimization',
    REVEAL: 'reveal'
  }
};

export const EVALUATION_CRITERIA = {
  CORRECTNESS: 'correctness',
  TIME_COMPLEXITY: 'time_complexity',
  SPACE_COMPLEXITY: 'space_complexity',
  CODE_QUALITY: 'code_quality',
  EDGE_CASES: 'edge_cases'
};

export const SCORING = {
  MAX_SCORE: 10,
  WEIGHTS: {
    CORRECTNESS: 3,
    TIME_COMPLEXITY: 2,
    SPACE_COMPLEXITY: 2,
    CODE_QUALITY: 2,
    EDGE_CASES: 1
  }
};

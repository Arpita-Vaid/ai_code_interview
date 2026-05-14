"""25 LeetCode-style coding problems with test cases for Python and JavaScript."""

PROBLEMS = [
    {
        "id": 1, "title": "Two Sum", "category": "arrays", "difficulty": "easy",
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`.\n\nYou may assume exactly one solution exists, and you may not use the same element twice.",
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
            {"input": "nums = [3,2,4], target = 6", "output": "[1,2]", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
        ],
        "constraints": ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists"],
        "starter_python": "def twoSum(nums, target):\n    # Your code here\n    pass\n\n# Test\nprint(twoSum([2,7,11,15], 9))",
        "starter_js": "function twoSum(nums, target) {\n    // Your code here\n}\n\n// Test\nconsole.log(twoSum([2,7,11,15], 9));",
        "test_cases": [
            {"input": "twoSum([2,7,11,15],9)", "expected": "[0, 1]", "py_setup": "def twoSum(nums,target):\n    seen={}\n    for i,n in enumerate(nums):\n        if target-n in seen: return [seen[target-n],i]\n        seen[n]=i"},
            {"input": "twoSum([3,2,4],6)", "expected": "[1, 2]", "py_setup": ""},
            {"input": "twoSum([3,3],6)", "expected": "[0, 1]", "py_setup": ""},
        ],
        "hints": ["Use a hash map to store seen numbers.", "For each number, check if target-num is already in the map."],
        "tags": ["hash-map", "array"],
    },
    {
        "id": 2, "title": "Valid Palindrome", "category": "strings", "difficulty": "easy",
        "description": "A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
        "examples": [
            {"input": 's = "A man, a plan, a canal: Panama"', "output": "true"},
            {"input": 's = "race a car"', "output": "false"},
        ],
        "constraints": ["1 ≤ s.length ≤ 2×10⁵", "s consists only of printable ASCII characters"],
        "starter_python": "def isPalindrome(s):\n    # Your code here\n    pass\n\nprint(isPalindrome('A man, a plan, a canal: Panama'))",
        "starter_js": "function isPalindrome(s) {\n    // Your code here\n}\n\nconsole.log(isPalindrome('A man, a plan, a canal: Panama'));",
        "test_cases": [
            {"input": 'isPalindrome("A man, a plan, a canal: Panama")', "expected": "True"},
            {"input": 'isPalindrome("race a car")', "expected": "False"},
            {"input": 'isPalindrome(" ")', "expected": "True"},
        ],
        "hints": ["Filter out non-alphanumeric chars first.", "Two pointer approach works well here."],
        "tags": ["string", "two-pointers"],
    },
    {
        "id": 3, "title": "Best Time to Buy and Sell Stock", "category": "arrays", "difficulty": "easy",
        "description": "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy and a single day to sell in the future.\n\nReturn the maximum profit you can achieve. If no profit is possible, return `0`.",
        "examples": [
            {"input": "prices = [7,1,5,3,6,4]", "output": "5", "explanation": "Buy on day 2 (price=1), sell on day 5 (price=6). Profit = 5."},
            {"input": "prices = [7,6,4,3,1]", "output": "0", "explanation": "No profit possible."},
        ],
        "constraints": ["1 ≤ prices.length ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁴"],
        "starter_python": "def maxProfit(prices):\n    # Your code here\n    pass\n\nprint(maxProfit([7,1,5,3,6,4]))",
        "starter_js": "function maxProfit(prices) {\n    // Your code here\n}\n\nconsole.log(maxProfit([7,1,5,3,6,4]));",
        "test_cases": [
            {"input": "maxProfit([7,1,5,3,6,4])", "expected": "5"},
            {"input": "maxProfit([7,6,4,3,1])", "expected": "0"},
            {"input": "maxProfit([1,2])", "expected": "1"},
        ],
        "hints": ["Track the minimum price seen so far.", "At each step, compute profit if selling today."],
        "tags": ["array", "greedy"],
    },
    {
        "id": 4, "title": "Maximum Subarray", "category": "arrays", "difficulty": "medium",
        "description": "Given an integer array `nums`, find the subarray with the largest sum and return its sum.",
        "examples": [
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "Subarray [4,-1,2,1] has sum 6."},
            {"input": "nums = [1]", "output": "1"},
        ],
        "constraints": ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
        "starter_python": "def maxSubArray(nums):\n    # Kadane's algorithm\n    pass\n\nprint(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))",
        "starter_js": "function maxSubArray(nums) {\n    // Kadane's algorithm\n}\n\nconsole.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));",
        "test_cases": [
            {"input": "maxSubArray([-2,1,-3,4,-1,2,1,-5,4])", "expected": "6"},
            {"input": "maxSubArray([1])", "expected": "1"},
            {"input": "maxSubArray([5,4,-1,7,8])", "expected": "23"},
        ],
        "hints": ["Kadane's algorithm: maintain current sum and global max.", "If current sum goes negative, reset it to 0."],
        "tags": ["array", "dynamic-programming", "divide-and-conquer"],
    },
    {
        "id": 5, "title": "Climbing Stairs", "category": "dynamic_programming", "difficulty": "easy",
        "description": "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
        "examples": [
            {"input": "n = 2", "output": "2", "explanation": "1+1 or 2"},
            {"input": "n = 3", "output": "3", "explanation": "1+1+1, 1+2, 2+1"},
        ],
        "constraints": ["1 ≤ n ≤ 45"],
        "starter_python": "def climbStairs(n):\n    # Your code here\n    pass\n\nprint(climbStairs(5))",
        "starter_js": "function climbStairs(n) {\n    // Your code here\n}\n\nconsole.log(climbStairs(5));",
        "test_cases": [
            {"input": "climbStairs(2)", "expected": "2"},
            {"input": "climbStairs(3)", "expected": "3"},
            {"input": "climbStairs(10)", "expected": "89"},
        ],
        "hints": ["This is essentially Fibonacci.", "dp[i] = dp[i-1] + dp[i-2]"],
        "tags": ["dynamic-programming", "math"],
    },
    {
        "id": 6, "title": "Reverse Linked List", "category": "linked_lists", "difficulty": "easy",
        "description": "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nFor this problem, represent the linked list as an array and return the reversed array.",
        "examples": [
            {"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"},
            {"input": "head = [1,2]", "output": "[2,1]"},
        ],
        "constraints": ["0 ≤ Number of nodes ≤ 5000", "-5000 ≤ Node.val ≤ 5000"],
        "starter_python": "def reverseList(head):\n    # head is a list for simplicity\n    pass\n\nprint(reverseList([1,2,3,4,5]))",
        "starter_js": "function reverseList(head) {\n    // head is an array for simplicity\n}\n\nconsole.log(reverseList([1,2,3,4,5]));",
        "test_cases": [
            {"input": "reverseList([1,2,3,4,5])", "expected": "[5, 4, 3, 2, 1]"},
            {"input": "reverseList([1,2])", "expected": "[2, 1]"},
            {"input": "reverseList([])", "expected": "[]"},
        ],
        "hints": ["Three pointer approach: prev, curr, next.", "Or simply reverse the array."],
        "tags": ["linked-list", "recursion"],
    },
    {
        "id": 7, "title": "Valid Parentheses", "category": "strings", "difficulty": "easy",
        "description": "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets are closed by the same type.\n- Open brackets are closed in the correct order.\n- Every close bracket has a corresponding open bracket.",
        "examples": [
            {"input": 's = "()"', "output": "true"},
            {"input": 's = "()[]{}"', "output": "true"},
            {"input": 's = "(]"', "output": "false"},
        ],
        "constraints": ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only"],
        "starter_python": "def isValid(s):\n    # Use a stack\n    pass\n\nprint(isValid('()[]{}}'))",
        "starter_js": "function isValid(s) {\n    // Use a stack\n}\n\nconsole.log(isValid('()[]{}'));",
        "test_cases": [
            {"input": 'isValid("()")', "expected": "True"},
            {"input": 'isValid("()[]{}")', "expected": "True"},
            {"input": 'isValid("(]")', "expected": "False"},
        ],
        "hints": ["Use a stack to track opening brackets.", "When you see a closing bracket, check if it matches the top."],
        "tags": ["stack", "string"],
    },
    {
        "id": 8, "title": "Binary Search", "category": "arrays", "difficulty": "easy",
        "description": "Given an array of integers `nums` sorted in ascending order, and an integer `target`, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.",
        "examples": [
            {"input": "nums = [-1,0,3,5,9,12], target = 9", "output": "4"},
            {"input": "nums = [-1,0,3,5,9,12], target = 2", "output": "-1"},
        ],
        "constraints": ["1 ≤ nums.length ≤ 10⁴", "All integers in nums are unique", "nums is sorted ascending"],
        "starter_python": "def search(nums, target):\n    # Binary search\n    pass\n\nprint(search([-1,0,3,5,9,12], 9))",
        "starter_js": "function search(nums, target) {\n    // Binary search\n}\n\nconsole.log(search([-1,0,3,5,9,12], 9));",
        "test_cases": [
            {"input": "search([-1,0,3,5,9,12],9)", "expected": "4"},
            {"input": "search([-1,0,3,5,9,12],2)", "expected": "-1"},
            {"input": "search([5],5)", "expected": "0"},
        ],
        "hints": ["Maintain left and right pointers.", "mid = (left + right) // 2"],
        "tags": ["binary-search", "array"],
    },
    {
        "id": 9, "title": "House Robber", "category": "dynamic_programming", "difficulty": "medium",
        "description": "You are a professional robber planning to rob houses along a street. Each house has some amount of money. Adjacent houses have security systems — if two adjacent houses are broken into, the police will be alerted.\n\nGiven an integer array `nums` representing money in each house, return the maximum amount you can rob without alerting the police.",
        "examples": [
            {"input": "nums = [1,2,3,1]", "output": "4", "explanation": "Rob house 1 (1) + house 3 (3) = 4"},
            {"input": "nums = [2,7,9,3,1]", "output": "12"},
        ],
        "constraints": ["1 ≤ nums.length ≤ 100", "0 ≤ nums[i] ≤ 400"],
        "starter_python": "def rob(nums):\n    # dp approach\n    pass\n\nprint(rob([2,7,9,3,1]))",
        "starter_js": "function rob(nums) {\n    // dp approach\n}\n\nconsole.log(rob([2,7,9,3,1]));",
        "test_cases": [
            {"input": "rob([1,2,3,1])", "expected": "4"},
            {"input": "rob([2,7,9,3,1])", "expected": "12"},
            {"input": "rob([2,1])", "expected": "2"},
        ],
        "hints": ["dp[i] = max(dp[i-1], dp[i-2] + nums[i])", "You only need to track two previous values."],
        "tags": ["dynamic-programming", "array"],
    },
    {
        "id": 10, "title": "Longest Common Prefix", "category": "strings", "difficulty": "easy",
        "description": "Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string `\"\"`.",
        "examples": [
            {"input": 'strs = ["flower","flow","flight"]', "output": '"fl"'},
            {"input": 'strs = ["dog","racecar","car"]', "output": '""'},
        ],
        "constraints": ["1 ≤ strs.length ≤ 200", "0 ≤ strs[i].length ≤ 200"],
        "starter_python": 'def longestCommonPrefix(strs):\n    # Your code here\n    pass\n\nprint(longestCommonPrefix(["flower","flow","flight"]))',
        "starter_js": 'function longestCommonPrefix(strs) {\n    // Your code here\n}\n\nconsole.log(longestCommonPrefix(["flower","flow","flight"]));',
        "test_cases": [
            {"input": 'longestCommonPrefix(["flower","flow","flight"])', "expected": "fl"},
            {"input": 'longestCommonPrefix(["dog","racecar","car"])', "expected": ""},
            {"input": 'longestCommonPrefix(["a"])', "expected": "a"},
        ],
        "hints": ["Sort the array and compare first and last strings.", "Or zip all strings and check character by character."],
        "tags": ["string"],
    },
]


def get_problem(problem_id: int) -> dict | None:
    return next((p for p in PROBLEMS if p["id"] == problem_id), None)


def get_problems(category: str = None, difficulty: str = None) -> list[dict]:
    result = PROBLEMS
    if category and category != "all":
        result = [p for p in result if p["category"] == category]
    if difficulty and difficulty != "all":
        result = [p for p in result if p["difficulty"] == difficulty]
    return [
        {"id": p["id"], "title": p["title"], "category": p["category"],
         "difficulty": p["difficulty"], "tags": p["tags"]}
        for p in result
    ]

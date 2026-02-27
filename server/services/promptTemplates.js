/**
 * Prompt Templates for LLM
 * 
 * Contains all system prompts and prompt engineering templates
 */

import { RESPONSE_FIELDS } from '../utils/constants.js';

/**
 * Main System Prompt for DSA Analysis
 */
export const SYSTEM_PROMPT = `You are CodeMentor, an expert DSA (Data Structures and Algorithms) interview coach with extensive experience at top tech companies like Google, Amazon, Meta, and Microsoft.

Your role is to analyze coding problems and provide comprehensive, interview-ready solutions. You MUST maintain a professional interviewer tone throughout.

## MANDATORY OUTPUT FORMAT

You MUST structure your response EXACTLY as follows. Do NOT skip any section:

### 1. PROBLEM UNDERSTANDING
- Restate the problem in your own words
- Identify input/output types
- Clarify any implicit constraints
- List key observations

### 2. BRUTE FORCE APPROACH
- Describe the naive solution
- Explain the thought process
- Identify inefficiencies
- Include pseudocode if helpful

### 3. OPTIMIZED APPROACH
- Present the optimal solution strategy
- Explain the key insight that enables optimization
- Describe the algorithm step-by-step
- Justify why this is better than brute force

### 4. TIME COMPLEXITY
- Provide Big-O notation
- Explain why this is the complexity
- Break down contribution of each operation

### 5. SPACE COMPLEXITY
- Provide Big-O notation
- Account for all auxiliary space
- Include recursion stack if applicable

### 6. EDGE CASES
List as bullet points:
- Empty input
- Single element
- All duplicates
- Negative numbers (if applicable)
- Large inputs
- Boundary conditions

### 7. JAVA IMPLEMENTATION
\`\`\`java
// Provide clean, production-ready Java code
// Include meaningful variable names
// Add inline comments for complex logic
// Handle edge cases
\`\`\`

### 8. DRY RUN EXAMPLE
- Walk through the algorithm with a sample input
- Show state changes step by step
- Demonstrate how the solution produces the output

### 9. FOLLOW-UP QUESTIONS
List 3-5 questions an interviewer might ask:
- Variations of the problem
- What if constraints change?
- Can you do better with specific conditions?

### 10. COMMON MISTAKES
List pitfalls candidates often make:
- Off-by-one errors
- Not handling edge cases
- Inefficient data structure choices
- Incorrect boundary conditions

### 11. PROBLEM VARIATIONS
List 2-3 related problems:
- Similar pattern problems
- Harder versions
- Real-world applications

## RULES
1. NEVER skip complexity analysis
2. ALWAYS provide working Java code
3. ALWAYS analyze edge cases thoroughly
4. Maintain interviewer perspective
5. Be precise with complexity analysis
6. Use proper DSA terminology`;

/**
 * System Prompt for Interview Mode (Guided Learning)
 */
export const INTERVIEW_MODE_PROMPT = `You are CodeMentor in INTERVIEW MODE - acting as a supportive technical interviewer.

Your goal is to GUIDE the candidate to discover the solution themselves, NOT to give away the answer.

## INTERVIEW MODE RULES

1. DO NOT reveal the optimized solution immediately
2. Start by acknowledging the problem
3. Ask clarifying questions to assess understanding
4. Provide hints progressively, from vague to specific
5. Encourage the candidate to think out loud
6. Praise good observations
7. Gently redirect incorrect approaches

## YOUR RESPONSE STRUCTURE

### Step 1: Problem Acknowledgment
"Great problem! Let's work through this together."

### Step 2: Clarifying Questions
Ask 2-3 questions like:
- "What's the expected input type?"
- "Are there any constraints on the values?"
- "What should we return if the input is empty?"

### Step 3: Guide Toward Approach
Instead of giving the answer:
- "What data structure might help us here?"
- "Can you think of a way to avoid checking every element?"
- "What property of the problem can we exploit?"

### Step 4: Progressive Hints
If stuck, provide increasingly specific hints:
- Hint 1: General direction
- Hint 2: Specific technique name
- Hint 3: Key insight

### Step 5: Validation
When they propose an approach:
- Confirm correct thinking
- Point out gaps
- Ask about complexity

## NEVER DO
- Give away the optimal solution immediately
- Write complete code without their input
- Skip complexity discussions
- Be discouraging

Respond as if you're in a real interview setting. Your role is to evaluate AND teach.`;

/**
 * Context Injection Template for RAG
 */
export const RAG_CONTEXT_TEMPLATE = `
## SIMILAR PROBLEMS FOR REFERENCE

The following are similar problems from our knowledge base. Use them to provide better context and related insights:

{{CONTEXT}}

---

Now analyze the user's problem using the above context where relevant:
`;

/**
 * Generate analysis prompt with RAG context
 */
export function generateAnalysisPrompt(problem, context = '') {
  let prompt = SYSTEM_PROMPT;
  
  if (context) {
    prompt += '\n\n' + RAG_CONTEXT_TEMPLATE.replace('{{CONTEXT}}', context);
  }
  
  prompt += `\n\n## USER'S PROBLEM\n\n${problem}\n\n## YOUR COMPREHENSIVE ANALYSIS`;
  
  return prompt;
}

/**
 * Generate interview mode prompt with context
 */
export function generateInterviewPrompt(problem, context = '', phase = 'initial') {
  let prompt = INTERVIEW_MODE_PROMPT;
  
  if (context) {
    prompt += `\n\n## REFERENCE (DO NOT REVEAL TO CANDIDATE)\n${context}`;
  }
  
  const phaseInstructions = {
    initial: '\n\nThis is the INITIAL interaction. Acknowledge the problem and ask clarifying questions.',
    understanding: '\n\nThe candidate is working on understanding. Ask probing questions.',
    approach: '\n\nGuide them toward an approach with progressive hints.',
    reveal: '\n\nTime to reveal the solution. Now provide the full comprehensive analysis.'
  };
  
  prompt += phaseInstructions[phase] || phaseInstructions.initial;
  prompt += `\n\n## PROBLEM\n${problem}`;
  
  return prompt;
}

/**
 * Code Evaluation System Prompt
 */
export const CODE_EVALUATION_PROMPT = `You are a code reviewer evaluating a candidate's solution to a DSA problem.

Analyze the provided Java code and return a structured evaluation.

## EVALUATION CRITERIA

### 1. Correctness (0-3 points)
- Does it solve the problem correctly?
- Does it handle all cases?
- Are there logical errors?

### 2. Time Complexity (0-2 points)
- What is the actual time complexity?
- Is it optimal?
- Are there unnecessary operations?

### 3. Space Complexity (0-2 points)
- What is the space usage?
- Can it be reduced?
- Is extra space justified?

### 4. Code Quality (0-2 points)
- Variable naming
- Code structure
- Readability
- Comments

### 5. Edge Case Handling (0-1 point)
- Empty input
- Boundary conditions
- Special cases

## OUTPUT FORMAT

Return your evaluation as JSON:

\`\`\`json
{
  "score": <total 0-10>,
  "breakdown": {
    "correctness": { "score": <0-3>, "feedback": "..." },
    "time_complexity": { "score": <0-2>, "feedback": "...", "detected": "O(?)" },
    "space_complexity": { "score": <0-2>, "feedback": "...", "detected": "O(?)" },
    "code_quality": { "score": <0-2>, "feedback": "..." },
    "edge_cases": { "score": <0-1>, "feedback": "...", "missing": [...] }
  },
  "suggestions": ["...", "..."],
  "optimal_solution_hint": "..."
}
\`\`\``;

/**
 * Generate code evaluation prompt
 */
export function generateEvaluationPrompt(problem, code) {
  return `${CODE_EVALUATION_PROMPT}

## PROBLEM STATEMENT
${problem}

## CANDIDATE'S CODE
\`\`\`java
${code}
\`\`\`

## YOUR EVALUATION`;
}

/**
 * Response parser to extract structured data
 */
export function parseStructuredResponse(llmResponse) {
  const sections = {
    understanding: '',
    brute_force: '',
    optimized: '',
    time_complexity: '',
    space_complexity: '',
    edge_cases: [],
    java_code: '',
    dry_run: '',
    follow_up_questions: [],
    common_mistakes: [],
    variations: []
  };
  
  try {
    // Extract Problem Understanding
    const understandingMatch = llmResponse.match(/### 1\. PROBLEM UNDERSTANDING\s*([\s\S]*?)(?=### 2\.|$)/i);
    if (understandingMatch) sections.understanding = understandingMatch[1].trim();
    
    // Extract Brute Force
    const bruteMatch = llmResponse.match(/### 2\. BRUTE FORCE APPROACH\s*([\s\S]*?)(?=### 3\.|$)/i);
    if (bruteMatch) sections.brute_force = bruteMatch[1].trim();
    
    // Extract Optimized
    const optimizedMatch = llmResponse.match(/### 3\. OPTIMIZED APPROACH\s*([\s\S]*?)(?=### 4\.|$)/i);
    if (optimizedMatch) sections.optimized = optimizedMatch[1].trim();
    
    // Extract Time Complexity
    const timeMatch = llmResponse.match(/### 4\. TIME COMPLEXITY\s*([\s\S]*?)(?=### 5\.|$)/i);
    if (timeMatch) sections.time_complexity = timeMatch[1].trim();
    
    // Extract Space Complexity
    const spaceMatch = llmResponse.match(/### 5\. SPACE COMPLEXITY\s*([\s\S]*?)(?=### 6\.|$)/i);
    if (spaceMatch) sections.space_complexity = spaceMatch[1].trim();
    
    // Extract Edge Cases (multiple format support)
    const edgeMatch = llmResponse.match(/###?\s*\d*\.?\s*EDGE CASES?\s*([\s\S]*?)(?=### 7\.|###|$)/i);
    if (edgeMatch) {
      const lines = edgeMatch[1].split('\n').filter(l => l.trim().match(/^[-•*\d]/));
      sections.edge_cases = lines.map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 0);
    }
    
    // Extract Java Code
    const codeMatch = llmResponse.match(/```java\s*([\s\S]*?)```/);
    if (codeMatch) sections.java_code = codeMatch[1].trim();
    
    // Extract Dry Run
    const dryRunMatch = llmResponse.match(/### 8\. DRY RUN EXAMPLE\s*([\s\S]*?)(?=### 9\.|$)/i);
    if (dryRunMatch) sections.dry_run = dryRunMatch[1].trim();
    
    // Extract Follow-up Questions (multiple format support)
    const followUpMatch = llmResponse.match(/###?\s*\d*\.?\s*FOLLOW[- ]?UP QUESTIONS?\s*([\s\S]*?)(?=###|$)/i);
    if (followUpMatch) {
      const lines = followUpMatch[1].split('\n').filter(l => l.trim().match(/^[-•*\d]/));
      sections.follow_up_questions = lines.map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 0);
    }
    
    // Extract Common Mistakes (multiple format support)
    const mistakesMatch = llmResponse.match(/###?\s*\d*\.?\s*COMMON MISTAKES?\s*([\s\S]*?)(?=###|$)/i);
    if (mistakesMatch) {
      const lines = mistakesMatch[1].split('\n').filter(l => l.trim().match(/^[-•*\d]/));
      sections.common_mistakes = lines.map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 0);
    }
    
    // Extract Variations (multiple format support)
    const variationsMatch = llmResponse.match(/###?\s*\d*\.?\s*PROBLEM VARIATIONS?\s*([\s\S]*?)(?=###|$)/i);
    if (variationsMatch) {
      const lines = variationsMatch[1].split('\n').filter(l => l.trim().match(/^[-•*\d]/));
      sections.variations = lines.map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 0);
    }
    
    // Fallback: Try to extract any bullet lists at the end for missing sections
    if (sections.follow_up_questions.length === 0) {
      const altFollowUp = llmResponse.match(/(?:interview|follow[-\s]?up|what if)[^\n]*:\s*([\s\S]*?)(?=###|common|variation|$)/i);
      if (altFollowUp) {
        const lines = altFollowUp[1].split('\n').filter(l => l.trim().match(/^[-•*\d]/));
        sections.follow_up_questions = lines.map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 0).slice(0, 5);
      }
    }
    
  } catch (error) {
    // If parsing fails, return raw response in understanding field
    sections.understanding = llmResponse;
  }
  
  return sections;
}

/**
 * Parse evaluation JSON response
 */
export function parseEvaluationResponse(llmResponse) {
  try {
    const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try parsing the whole response as JSON
    return JSON.parse(llmResponse);
  } catch (error) {
    // Return a default structure if parsing fails
    return {
      score: 0,
      breakdown: {
        correctness: { score: 0, feedback: 'Unable to evaluate' },
        time_complexity: { score: 0, feedback: 'Unable to evaluate', detected: 'Unknown' },
        space_complexity: { score: 0, feedback: 'Unable to evaluate', detected: 'Unknown' },
        code_quality: { score: 0, feedback: 'Unable to evaluate' },
        edge_cases: { score: 0, feedback: 'Unable to evaluate', missing: [] }
      },
      suggestions: ['Unable to parse evaluation response'],
      optimal_solution_hint: '',
      raw_response: llmResponse
    };
  }
}

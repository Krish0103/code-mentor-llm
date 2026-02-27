const API_BASE = '/api'

export async function analyzeProgram(problem) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ problem }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `Server error: ${response.status}`)
  }

  return response.json()
}

export async function evaluateSolution(problem, solution) {
  const response = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ problem, solution }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `Server error: ${response.status}`)
  }

  return response.json()
}

export async function checkHealth() {
  const response = await fetch('/health')
  return response.ok
}

// Task Management Application
class TodoApp {
  constructor() {
    this.tasks = this.loadTasks()
    this.taskIdCounter = this.getNextTaskId()
    this.initializeElements()
    this.bindEvents()
    this.render()
  }

  // Initialize DOM elements
  initializeElements() {
    this.taskForm = document.getElementById("addTaskForm")
    this.taskInput = document.getElementById("taskInput")
    this.addBtn = document.getElementById("addBtn")
    this.errorMessage = document.getElementById("errorMessage")
    this.taskList = document.getElementById("taskList")
    this.emptyState = document.getElementById("emptyState")
    this.clearCompletedBtn = document.getElementById("clearCompletedBtn")

    // Statistics elements
    this.totalTasksEl = document.getElementById("totalTasks")
    this.completedTasksEl = document.getElementById("completedTasks")
    this.pendingTasksEl = document.getElementById("pendingTasks")
  }

  // Bind event listeners
  bindEvents() {
    this.taskForm.addEventListener("submit", (e) => this.handleAddTask(e))
    this.clearCompletedBtn.addEventListener("click", () => this.clearCompletedTasks())

    // Real-time input validation
    this.taskInput.addEventListener("input", () => this.clearError())
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        this.handleAddTask(e)
      }
    })
  }

  // Handle adding new task
  handleAddTask(e) {
    e.preventDefault()

    const taskText = this.taskInput.value.trim()

    // Validation
    if (!this.validateTask(taskText)) {
      return
    }

    // Create new task
    const newTask = {
      id: this.taskIdCounter++,
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      editing: false,
    }

    // Add task to array
    this.tasks.unshift(newTask)

    // Save to localStorage
    this.saveTasks()

    // Clear input and error
    this.taskInput.value = ""
    this.clearError()

    // Re-render
    this.render()

    // Focus back to input for better UX
    this.taskInput.focus()
  }

  // Validate task input
  validateTask(taskText) {
    this.clearError()

    if (!taskText) {
      this.showError("Please enter a task description")
      this.taskInput.focus()
      return false
    }

    if (taskText.length > 200) {
      this.showError("Task description must be less than 200 characters")
      return false
    }

    // Check for duplicate tasks
    const isDuplicate = this.tasks.some((task) => task.text.toLowerCase() === taskText.toLowerCase())

    if (isDuplicate) {
      this.showError("This task already exists")
      return false
    }

    return true
  }

  // Show error message
  showError(message) {
    this.errorMessage.textContent = message
    this.errorMessage.style.opacity = "1"

    // Auto-clear error after 3 seconds
    setTimeout(() => this.clearError(), 3000)
  }

  // Clear error message
  clearError() {
    this.errorMessage.textContent = ""
    this.errorMessage.style.opacity = "0"
  }

  // Toggle task completion
  toggleTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.completed = !task.completed
      this.saveTasks()
      this.render()
    }
  }

  // Start editing task
  startEditTask(taskId) {
    // Cancel any other editing tasks
    this.tasks.forEach((task) => (task.editing = false))

    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.editing = true
      this.render()

      // Focus on the edit input
      setTimeout(() => {
        const editInput = document.querySelector(`[data-task-id="${taskId}"] .task-input-edit`)
        if (editInput) {
          editInput.focus()
          editInput.select()
        }
      }, 0)
    }
  }

  // Save edited task
  saveEditTask(taskId, newText) {
    const trimmedText = newText.trim()

    if (!trimmedText) {
      this.showError("Task description cannot be empty")
      return false
    }

    if (trimmedText.length > 200) {
      this.showError("Task description must be less than 200 characters")
      return false
    }

    // Check for duplicates (excluding current task)
    const isDuplicate = this.tasks.some(
      (task) => task.id !== taskId && task.text.toLowerCase() === trimmedText.toLowerCase(),
    )

    if (isDuplicate) {
      this.showError("This task already exists")
      return false
    }

    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.text = trimmedText
      task.editing = false
      this.saveTasks()
      this.render()
    }

    return true
  }

  // Cancel editing task
  cancelEditTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.editing = false
      this.render()
    }
  }

  // Delete task
  deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      this.tasks = this.tasks.filter((t) => t.id !== taskId)
      this.saveTasks()
      this.render()
    }
  }

  // Clear all completed tasks
  clearCompletedTasks() {
    const completedCount = this.tasks.filter((t) => t.completed).length

    if (completedCount === 0) {
      return
    }

    if (confirm(`Are you sure you want to delete ${completedCount} completed task${completedCount > 1 ? "s" : ""}?`)) {
      this.tasks = this.tasks.filter((t) => !t.completed)
      this.saveTasks()
      this.render()
    }
  }

  // Render the entire application
  render() {
    this.renderTasks()
    this.renderStatistics()
    this.updateClearButton()
  }

  // Render task list
  renderTasks() {
    // Clear current tasks
    this.taskList.innerHTML = ""

    // Show/hide empty state
    if (this.tasks.length === 0) {
      this.emptyState.classList.remove("hidden")
      return
    } else {
      this.emptyState.classList.add("hidden")
    }

    // Render each task
    this.tasks.forEach((task) => {
      const taskElement = this.createTaskElement(task)
      this.taskList.appendChild(taskElement)
    })
  }

  // Create individual task element
  createTaskElement(task) {
    const li = document.createElement("li")
    li.className = `task-item ${task.completed ? "completed" : ""}`
    li.setAttribute("data-task-id", task.id)

    if (task.editing) {
      li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} disabled>
                <div class="task-content">
                    <input type="text" class="task-input-edit" value="${this.escapeHtml(task.text)}" maxlength="200">
                </div>
                <div class="task-actions">
                    <button class="task-btn save-btn" onclick="todoApp.handleSaveEdit(${task.id})">Save</button>
                    <button class="task-btn cancel-btn" onclick="todoApp.cancelEditTask(${task.id})">Cancel</button>
                </div>
            `

      // Add enter/escape key handlers for edit input
      const editInput = li.querySelector(".task-input-edit")
      editInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleSaveEdit(task.id)
        }
      })
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.cancelEditTask(task.id)
        }
      })
    } else {
      li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} 
                       onchange="todoApp.toggleTask(${task.id})">
                <div class="task-content">
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" onclick="todoApp.startEditTask(${task.id})" 
                            ${task.completed ? "disabled" : ""}>Edit</button>
                    <button class="task-btn delete-btn" onclick="todoApp.deleteTask(${task.id})">Delete</button>
                </div>
            `
    }

    return li
  }

  // Handle save edit with validation
  handleSaveEdit(taskId) {
    const editInput = document.querySelector(`[data-task-id="${taskId}"] .task-input-edit`)
    if (editInput) {
      this.saveEditTask(taskId, editInput.value)
    }
  }

  // Render statistics
  renderStatistics() {
    const total = this.tasks.length
    const completed = this.tasks.filter((t) => t.completed).length
    const pending = total - completed

    this.totalTasksEl.textContent = total
    this.completedTasksEl.textContent = completed
    this.pendingTasksEl.textContent = pending
  }

  // Update clear completed button state
  updateClearButton() {
    const hasCompleted = this.tasks.some((t) => t.completed)
    this.clearCompletedBtn.disabled = !hasCompleted
  }

  // Local Storage Methods
  saveTasks() {
    try {
      localStorage.setItem("todoApp_tasks", JSON.stringify(this.tasks))
      localStorage.setItem("todoApp_taskIdCounter", this.taskIdCounter.toString())
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error)
      this.showError("Failed to save tasks. Please try again.")
    }
  }

  loadTasks() {
    try {
      const saved = localStorage.getItem("todoApp_tasks")
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error)
      return []
    }
  }

  getNextTaskId() {
    try {
      const saved = localStorage.getItem("todoApp_taskIdCounter")
      return saved ? Number.parseInt(saved, 10) : 1
    } catch (error) {
      console.error("Error loading task ID counter:", error)
      return 1
    }
  }

  // Utility method to escape HTML
  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.todoApp = new TodoApp()
})

// Handle page visibility change to refresh data
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && window.todoApp) {
    // Reload tasks in case they were modified in another tab
    window.todoApp.tasks = window.todoApp.loadTasks()
    window.todoApp.render()
  }
})

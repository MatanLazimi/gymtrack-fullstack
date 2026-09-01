import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/Auth/AuthPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ExercisesPage } from './pages/Exercises/ExercisesPage';
import { NewWorkoutPage } from './pages/Workout/NewWorkoutPage';
import { WorkoutPage } from './pages/Workout/WorkoutPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute>
            <ExercisesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/new"
        element={
          <ProtectedRoute>
            <NewWorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/:id"
        element={
          <ProtectedRoute>
            <WorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

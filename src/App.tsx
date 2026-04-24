import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useCareerMithra } from "./context/useCareerMithra";
import { AnalyticsDashboardPage } from "./pages/AnalyticsDashboardPage";
import { ApplicationTrackingPage } from "./pages/ApplicationTrackingPage";
import { AuthPage } from "./pages/AuthPage";
import { CareerInsightsPage } from "./pages/CareerInsightsPage";
import { ContinuousGuidancePage } from "./pages/ContinuousGuidancePage";
import { HomeDashboardPage } from "./pages/HomeDashboardPage";
import { InterviewPrepPage } from "./pages/InterviewPrepPage";
import { JobDiscoveryPage } from "./pages/JobDiscoveryPage";
import { LearningSkillPage } from "./pages/LearningSkillPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProgressTrackingPage } from "./pages/ProgressTrackingPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import { ResumePreparationPage } from "./pages/ResumePreparationPage";
import { RoadmapPage } from "./pages/RoadmapPage";

function App() {
  const { state } = useCareerMithra();

  if (!state.isAuthenticated) {
    return <AuthPage />;
  }

  if (!state.onboardingComplete) {
    return <OnboardingPage />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<HomeDashboardPage />} />
        <Route path="/career-insights" element={<CareerInsightsPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/learning-skill" element={<LearningSkillPage />} />
        <Route path="/progress" element={<ProgressTrackingPage />} />
        <Route path="/resume-preparation" element={<ResumePreparationPage />} />
        <Route path="/profile-settings" element={<ProfileSettingsPage />} />
        <Route path="/job-discovery" element={<JobDiscoveryPage />} />
        <Route
          path="/application-tracking"
          element={<ApplicationTrackingPage />}
        />
        <Route
          path="/continuous-guidance"
          element={<ContinuousGuidancePage />}
        />
        <Route path="/analytics" element={<AnalyticsDashboardPage />} />
        <Route path="/interview-prep" element={<InterviewPrepPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

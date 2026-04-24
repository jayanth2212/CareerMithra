import { useMemo, useState } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import {
  analyzeUserActivity,
  generateAdminAnalytics,
  type UserActivity,
} from "../services/activityAnalyzer";

export function AnalyticsDashboardPage() {
  const { state } = useCareerMithra();

  // ✅ FIXED: Only declared once
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [sortBy, setSortBy] = useState<"engagement" | "applications" | "name">(
    "engagement",
  );

  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "new"
  >("all");

  const currentUserActivity = useMemo(
    () => analyzeUserActivity(state),
    [state],
  );

  const adminAnalytics = useMemo(
    () =>
      generateAdminAnalytics(state, [
        currentUserActivity,
        ...generateMockUsers(),
      ]),
    [state, currentUserActivity],
  );

  const allUsers = useMemo(() => {
    const users = [currentUserActivity, ...generateMockUsers()];

    const filtered =
      filterStatus === "all"
        ? users
        : users.filter((u) => u.status === filterStatus);

    return filtered.sort((a, b) => {
      if (sortBy === "engagement") {
        return b.engagementScore - a.engagementScore;
      } else if (sortBy === "applications") {
        return b.totalApplications - a.totalApplications;
      } else {
        return a.userName.localeCompare(b.userName);
      }
    });
  }, [currentUserActivity, sortBy, filterStatus]);

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero analytics-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">ADMIN ANALYTICS</span>
          <h2>User Activity Dashboard</h2>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Total Users</span>
            <strong>{adminAnalytics.totalUsers}</strong>
          </article>
          <article>
            <span>Active Users</span>
            <strong>{adminAnalytics.activeUsers}</strong>
          </article>
          <article>
            <span>Avg Engagement</span>
            <strong>{adminAnalytics.avgEngagementScore}%</strong>
          </article>
          <article>
            <span>Success Rate</span>
            <strong>{adminAnalytics.successRateOverall}%</strong>
          </article>
        </div>
      </header>

      <article className="panel feature-panel user-activity-panel">
        <div className="user-list-header">
          <h3>👤 User Activity Details</h3>

          <div className="user-controls">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "engagement" | "applications" | "name",
                )
              }
            >
              <option value="engagement">Sort by Engagement</option>
              <option value="applications">Sort by Applications</option>
              <option value="name">Sort by Name</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "active" | "inactive" | "new",
                )
              }
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New</option>
            </select>
          </div>
        </div>

        <div className="user-list">
          {allUsers.map((user) => (
            <div
              key={user.userId}
              className={`user-item ${
                selectedUser?.userId === user.userId ? "selected" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <strong>{user.userName}</strong>
              <span>{user.engagementScore}%</span>
            </div>
          ))}
        </div>

        {selectedUser && (
          <div className="user-details">
            <h4>{selectedUser.userName}</h4>
            <p>Email: {selectedUser.userEmail}</p>
            <p>Applications: {selectedUser.totalApplications}</p>
            <p>Success Rate: {selectedUser.applicationSuccessRate}%</p>
          </div>
        )}
      </article>
    </section>
  );
}

function generateMockUsers(): UserActivity[] {
  const demoUser: UserActivity = {
    userId: "1",
    userName: "Demo User",
    userEmail: "demo@email.com",
    totalApplications: 5,
    successfulApplications: 2,
    applicationSuccessRate: 40,
    profileCompleteness: 80,
    careerSelected: true,
    learningTasksCompleted: 5,
    totalLearningTasks: 10,
    milestones: {},
    engagementScore: 75,
    status: "active",
    recentActions: [],
  };

  return [demoUser];
}

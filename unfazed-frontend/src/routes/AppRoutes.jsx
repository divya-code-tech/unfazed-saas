import { Route, Routes } from "react-router-dom";



import Dashboard from "../pages/therapist/Dashboard";
import Clients from "../pages/therapist/Clients";
import ClientProfile from "../pages/therapist/ClientProfile";
import Schedule from "../pages/therapist/Schedule";
import Notes from "../pages/therapist/Notes";
import Analytics from "../pages/therapist/Analytics";
import Profile from "../pages/therapist/Profile";
import Packages from "../pages/therapist/Packages";
import Chat from "../pages/therapist/Chat";
import Subscription from "../pages/therapist/Subscription";

import TherapistProfile from "../pages/TherapistProfile";

import ClientPortal from "../pages/client/ClientPortal";
import BookingPage from "../pages/client/BookingPage";
import Payment from "../pages/client/Payment";

import Login from "../auth/Login";
import Register from "../auth/Register";

import AppShell from "../components/common/AppShell";



function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
           
      
      {/* Public therapist branded profile */}
      <Route path="/:slug" element={<TherapistProfile />} />


      {/* Therapist workspace */}
      <Route
        path="/therapist"
        element={
          <AppShell>
            <Dashboard />
          </AppShell>
        }
      />

      <Route
        path="/therapist/dashboard"
        element={
          <AppShell>
            <Dashboard />
          </AppShell>
        }
      />

      <Route
        path="/therapist/profile"
        element={
         <AppShell>
            <Profile />
          </AppShell>
        }
      />

      <Route
        path="/therapist/clients"
        element={
          <AppShell>
            <Clients />
          </AppShell>
        }
      />

      <Route
        path="/therapist/clients/:id"
        element={
          <AppShell>
            <ClientProfile />
          </AppShell>
        }
     />


      <Route
        path="/therapist/schedule"
        element={
          <AppShell>
            <Schedule />
          </AppShell>
        }
      />

      <Route
        path="/therapist/notes"
        element={
          <AppShell>
            <Notes />
          </AppShell>
        }
      />

      <Route
        path="/therapist/analytics"
        element={
          <AppShell>
            <Analytics />
          </AppShell>
        }
      />

      <Route
        path="/therapist/packages"
        element={
          <AppShell>
            <Packages />
          </AppShell>
      }
    />

    <Route
      path="/therapist/chat"
      element={
        <AppShell>
           <Chat />
        </AppShell>
      }
  />

  <Route
       path="/therapist/subscription"
       element={
    <AppShell>
      <Subscription />
    </AppShell>
  }
/>

      {/* Client experience */}
      <Route
        path="/client-portal"
        element={<ClientPortal />}
      />

      <Route
        path="/booking"
        element={<BookingPage />}
      />

      <Route
        path="/payment"
        element={<Payment />}
      />
    </Routes>
  );
}



export default AppRoutes;
import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Loading } from "./components/ui/States";
import { ThemeProvider } from "./theme/ThemeContext";

const MissionControl = lazy(() => import("./pages/MissionControl"));
const Insights = lazy(() => import("./pages/Insights"));
const GuidedSearch = lazy(() => import("./pages/GuidedSearch"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const LabelDocument = lazy(() => import("./pages/LabelDocument"));
const LabelDetail = lazy(() => import("./pages/LabelDetail"));
const FacilitySearch = lazy(() => import("./pages/FacilitySearch"));
const FacilityDetail = lazy(() => import("./pages/FacilityDetail"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

export function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<div className="container"><Loading label="Loading page" /></div>}>
        <Routes>
          <Route path="/" element={<MissionControl />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/guided-search" element={<GuidedSearch />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/labels/:documentId" element={<LabelDocument />} />
          <Route path="/labels/:documentId/:ndc" element={<LabelDetail />} />
          <Route path="/facilities" element={<FacilitySearch />} />
          <Route path="/facilities/:fei" element={<FacilityDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ThemeProvider>
  );
}

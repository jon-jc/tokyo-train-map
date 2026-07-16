"use client";

import dynamic from "next/dynamic";
import Loader from "@/components/ui/Loader";

const App = dynamic(() => import("@/components/App"), {
  ssr: false,
  loading: () => <Loader />,
});

export default function Page() {
  return (
    <div id="app-root">
      <App />
    </div>
  );
}

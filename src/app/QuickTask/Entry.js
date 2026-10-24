'use client';

import { Routes, Route } from "react-router-dom";
import QuickTaskApp from "./components/QuickTask";
import TaskTable from "./components/Tasktable";

const Entry = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<QuickTaskApp />} />
        <Route path="/list" element={<TaskTable />} />
      </Routes>
    </>
  );
};

export default Entry;

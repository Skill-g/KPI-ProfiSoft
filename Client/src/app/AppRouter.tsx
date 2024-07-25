import { HOME_ROUTE } from "@/app/consts";
import { PubRoutes } from "@/routes";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Router = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      {!isLoading && (
        <Routes>
          {PubRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          <Route path="*" element={<Navigate to={HOME_ROUTE} replace />} />
        </Routes>
      )}
    </>
  );
};

export default Router;

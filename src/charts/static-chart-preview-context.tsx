import { createContext, useContext } from "react";

const StaticChartPreviewContext = createContext<boolean>(false);

export function StaticChartPreviewProvider({
  children,
  isPreview = false,
}: {
  children: React.ReactNode;
  isPreview?: boolean;
}) {
  return (
    <StaticChartPreviewContext.Provider value={isPreview}>
      {children}
    </StaticChartPreviewContext.Provider>
  );
}

export function useStaticChartPreview(): boolean {
  return useContext(StaticChartPreviewContext);
}

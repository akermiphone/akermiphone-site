import React from "react";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme, lightTheme } from "./theme";
import { HashRouter, Routes, Route } from "react-router-dom";
import InvoiceVerificationPage from "./pages/InvoiceVerificiationPage";
import NotFoundPage from "./pages/NotFoundPage";

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <Box>
        <InvoiceVerificationPage />
      </Box>
    </ThemeProvider>
  );
};

export default App;

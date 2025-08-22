import React from "react";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme, lightTheme } from "./theme";
import { Routes, Route } from "react-router-dom";
import InvoiceVerificationPage from "./pages/InvoiceVerificiationPage";
import NotFoundPage from "./pages/NotFoundPage";

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <Box>
        <Routes>
          <Route path="/verifyInvoice" element={<InvoiceVerificationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
};

export default App;

import React from "react";
import { Box, useTheme } from "@mui/material";

/**
 * NotFoundPage (404 / Invoice not found)
 * - Uses only MUI <Box> components for layout and visual elements
 * - Responsive: column layout on small screens, row layout on larger
 * - Centered content with contact info and a small invoice-card SVG
 */
const NotFoundPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 3,
        py: { xs: 6, md: 10 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 840,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: { xs: 3, md: 4 },
          bgcolor: "background.paper",
          boxShadow: 6,
          borderRadius: 2,
          p: { xs: 3, md: 6 },

          // lift the whole panel slightly so visuals are higher on the screen
          transform: { xs: "translateY(-3vh)", md: "translateY(-6vh)" },
        }}
      >
        {/* Top visual row: 404 + Invoice SVG */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 2, md: 4 },
          }}
        >
          {/* Big 404 number */}
          <Box
            component="span"
            sx={{
              fontSize: { xs: "3.25rem", md: "4.5rem" },
              fontWeight: 800,
              color: "primary.main",
              letterSpacing: -1,
              lineHeight: 1,
              flex: "0 0 auto",
            }}
          >
            404
          </Box>

          {/* Invoice card SVG */}
          <Box
            sx={{
              width: { xs: 120, sm: 140, md: 180 },
              height: { xs: 72, sm: 84, md: 108 },
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              bgcolor: `${theme.palette.primary.main}10`,
              boxShadow: `0 6px 18px rgba(0,0,0,0.06)`,
              p: 0.5,
            }}
            aria-hidden
          >
            <Box
              component="svg"
              viewBox="0 0 64 40"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1"
                y="1"
                width="62"
                height="38"
                rx="3"
                fill="none"
                stroke={theme.palette.primary.main}
                strokeWidth="1.6"
              />
              <path
                d="M6 10h38"
                stroke={theme.palette.primary.main}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M6 16h26"
                stroke={theme.palette.text.secondary}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M6 22h20"
                stroke={theme.palette.text.secondary}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M6 28h14"
                stroke={theme.palette.text.secondary}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </Box>
          </Box>
        </Box>

        {/* Message */}
        <Box
          component="h1"
          sx={{
            m: 0,
            fontSize: { xs: "1.15rem", md: "1.45rem" },
            fontWeight: 700,
            color: "text.primary",
            mt: { xs: 0.5, md: 0 },
          }}
        >
          Oops — invoice or page not found
        </Box>

        <Box
          component="p"
          sx={{
            m: 0,
            color: "text.secondary",
            fontSize: { xs: "0.95rem", md: "1rem" },
            lineHeight: 1.6,
            maxWidth: 640,
          }}
        >
          The invoice you’re looking for doesn’t seem to exist. This might
          happen if the QR code is old, the invoice has been removed, or the URL
          was mistyped.
        </Box>

        {/* Contact information */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            color: "text.secondary",
            fontSize: { xs: "0.9rem", md: "1rem" },
          }}
        >
          <Box>Email: akermiphone@gmail.com</Box>
          <Box>Phone: +213797408717</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NotFoundPage;

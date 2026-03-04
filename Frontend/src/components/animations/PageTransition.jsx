import { motion } from "framer-motion";

const MotionContainer = motion.div;

const PageTransition = ({ children }) => {
  return (
    <MotionContainer
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="min-h-screen"
    >
      {children}
    </MotionContainer>
  );
};

export default PageTransition;

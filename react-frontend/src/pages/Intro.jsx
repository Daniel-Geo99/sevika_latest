import { motion } from "framer-motion";
import { useEffect } from "react";

const Intro = ({ onFinish }) => {
  const sevikaText = "Sevika";

  useEffect(() => {
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const letterVariant = {
    hidden: { y: 100, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 120,
      },
    }),
  };

  return (
    <div className="intro-overlay">
      <motion.h1 className="intro-text">
        {sevikaText.split("").map((letter, index) => (
          <motion.span
            key={index}
            custom={index}
            variants={letterVariant}
            initial="hidden"
            animate="visible"
            style={{ display: "inline-block", marginRight: "5px" }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.h1>
    </div>
  );
};

export default Intro;

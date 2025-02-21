// Generate a color from a user ID (deterministic)
export const getUserColor = (userId) => {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD",
      "#FF9999", "#7FB3D5", "#A2D9CE", "#D4EFDF", "#F9E79F"
    ];
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
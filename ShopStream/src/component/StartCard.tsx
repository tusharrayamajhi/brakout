import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="p-4 bg-black backdrop-blur-md rounded-lg border">
      <p className="text-sm text-gray-300">{title}</p>
      <p className="text-2xl text-white font-semibold">{value}</p>
    </div>
  );
};

export default StatCard;

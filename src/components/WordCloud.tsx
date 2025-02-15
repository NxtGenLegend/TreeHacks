import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-cloud';

interface WordCloudProps {
  words: string[];
  onWordClick: (word: string) => void;
  activeWord?: string;
}

export function WordCloud({ words, onWordClick, activeWord }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  useEffect(() => {
    if (!dimensions.width || !words.length) return;

    const layout = d3.layout.cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map(word => ({ text: word, size: 20 + Math.random() * 30 })))
      .padding(5)
      .rotate(() => 0)
      .font("Inter")
      .fontSize(d => d.size!)
      .on("end", draw);

    layout.start();

    function draw(words: d3.Word[]) {
      const container = d3.select(containerRef.current);
      container.selectAll("*").remove();

      const svg = container.append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`);

      svg.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", d => `${d.size}px`)
        .style("font-family", "Inter")
        .style("fill", d => activeWord ? (d.text === activeWord ? "#4F46E5" : "#9CA3AF") : "#4F46E5")
        .style("cursor", "pointer")
        .style("transition", "all 0.3s ease")
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text)
        .on("click", (_, d) => onWordClick(d.text));
    }
  }, [words, dimensions, activeWord]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[400px] bg-white rounded-lg shadow-lg p-4"
    />
  );
}
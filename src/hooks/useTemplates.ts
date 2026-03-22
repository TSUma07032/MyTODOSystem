// src/hooks/useTemplates.ts
import { useState, useEffect } from 'react';

export interface Template {
  id: string;
  name: string;
  subTasks: string[];
}

const DEFAULT_TEMPLATES: Template[] = [
  { id: 'tpl-1', name: "🏋️ 筋トレセット", subTasks: ["腕立て伏せ 30回", "腹筋 30回", "スクワット 30回"] },
  { id: 'tpl-2', name: "📚 読書セット", subTasks: ["第1章を読む", "要約をメモする"] },
  { id: 'tpl-3', name: "🧹 掃除セット", subTasks: ["デスク周りの整理", "床の掃除機掛け", "ゴミ捨て"] }
];

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pomodoro_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pomodoro_templates', JSON.stringify(templates));
    }
  }, [templates, isLoaded]);

  const addTemplate = (name: string, subTasks: string[]) => {
    const newTemplate: Template = {
      id: `tpl-${Date.now()}`,
      name,
      subTasks
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const updateTemplate = (id: string, name: string, subTasks: string[]) => {
    setTemplates(prev => prev.map(tpl => 
      tpl.id === id ? { ...tpl, name, subTasks } : tpl
    ));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return { templates, addTemplate, updateTemplate, deleteTemplate };
};
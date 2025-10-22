
import { GoogleGenAI } from "@google/genai";
import { User, Sale, Goal, StoreProgress } from '../types';

// FIX: Aligned with @google/genai guidelines to use process.env.API_KEY directly and assume its availability.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Added storeProgress parameter to provide complete data to the model and fixed incorrect property access.
export const getCoachingPlan = async (prompt: string, users: User[], sales: Sale[], goals: Goal | undefined, storeProgress: StoreProgress[]): Promise<string> => {
  if (!prompt.trim()) {
    return "Por favor, introduce un objetivo para empezar.";
  }

  const model = 'gemini-2.5-flash';
  
  const fullPrompt = `
    You are an expert sales coach and business strategist for a retail team. 
    Your tone should be professional, data-driven, and highly actionable.
    Based on the following JSON data, provide a concise and powerful action plan to help the manager achieve their stated objective.

    **Team Members:**
    ${JSON.stringify(users, null, 2)}

    **Sales Data for the Current Month (from this app):**
    ${JSON.stringify(sales, null, 2)}

    **Monthly Goals:**
    ${JSON.stringify(goals?.teamGoal, null, 2)}

    **Daily Aggregated Store Progress this Month (manually entered):**
    ${JSON.stringify(storeProgress, null, 2)}

    **Manager's Objective:**
    "${prompt}"

    Your response should be structured in Spanish as a coaching plan with the following sections:
    1.  **Análisis General de Rendimiento:** A brief, high-level summary of the current situation based on the data (consider both daily aggregated progress and new individual sales).
    2.  **Áreas Clave de Mejora:** Identify 2-3 specific, critical areas that need attention.
    3.  **Pasos Accionables:** Provide a clear, step-by-step plan. For each step, specify WHO should do it and WHAT they should do. Be very specific.
    4.  **Consejo de Coaching:** A short, motivational tip for the manager to use with their team.

    Format your response using Markdown. Use bolding and bullet points to make it easy to read.
    Do not invent data. Base your entire analysis solely on the JSON data provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Lo siento, encontré un error al analizar los datos. Por favor, revisa la consola para más detalles e inténtalo de nuevo.";
  }
};


export const getDetailedReportAnalysis = async (
  users: User[], 
  currentGoal: Goal | undefined, 
  storeProgress: StoreProgress[], 
  sales: Sale[]
): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Eres un analista experto en rendimiento de ventas minoristas.
    Basándote en los datos JSON proporcionados para un equipo de ventas para el mes actual, genera un informe de rendimiento completo en español.

    El informe debe tener dos secciones claras:
    1.  **Análisis de Puntos Débiles:** Un análisis detallado que identifique las áreas clave en las que el equipo está rindiendo por debajo de sus metas. Utiliza los datos para respaldar tus conclusiones. Sé específico. Por ejemplo, "El equipo está un X% por debajo del objetivo general de ventas, impulsado principalmente por un déficit del Y% en la categoría 'Calzado'".
    2.  **Plan de Mejora Accionable:** Un plan de mejora claro y paso a paso. Para cada paso, especifica acciones concretas que el gerente y el equipo pueden tomar. El plan debe ser realista y abordar directamente las debilidades identificadas en el análisis.

    **Datos Proporcionados:**
    - Miembros del equipo y sus roles.
    - Metas mensuales (para el equipo e individuales).
    - Registros de progreso diario agregado de la tienda.
    - Registros de ventas individuales del mes.

    **DATOS JSON:**
    Miembros del Equipo:
    ${JSON.stringify(users, null, 2)}

    Metas Mensuales:
    ${JSON.stringify(currentGoal, null, 2)}

    Progreso Diario Agregado de la Tienda:
    ${JSON.stringify(storeProgress, null, 2)}

    Ventas Individuales del Mes:
    ${JSON.stringify(sales, null, 2)}

    ---
    Formatea toda tu respuesta en Markdown. Usa negritas para los títulos y viñetas para las listas. No inventes datos. Basa todo tu análisis únicamente en los datos JSON proporcionados.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for report analysis:", error);
    return "Lo siento, encontré un error al generar el análisis del informe. Por favor, revisa la consola para más detalles.";
  }
};

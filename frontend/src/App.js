import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';

const COLUMNAS_INICIALES = {
  "En proceso": { id: "En proceso", titulo: "En Proceso", tareas: [] },
  "En desarrollo": { id: "En desarrollo", titulo: "En Desarrollo", tareas: [] },
  "Terminado": { id: "Terminado", titulo: "Terminado", tareas: [] }
};

function App() {
  const [columnas, setColumnas] = useState(COLUMNAS_INICIALES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/comunicaciones')
      .then(res => {
        const nuevasColumnas = {
          "En proceso": { ...COLUMNAS_INICIALES["En proceso"], tareas: [] },
          "En desarrollo": { ...COLUMNAS_INICIALES["En desarrollo"], tareas: [] },
          "Terminado": { ...COLUMNAS_INICIALES["Terminado"], tareas: [] }
        };
        res.data.forEach(item => {
          const est = nuevasColumnas[item.Estado] ? item.Estado : "En proceso";
          nuevasColumnas[est].tareas.push(item);
        });
        setColumnas(nuevasColumnas);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const colOrigen = columnas[source.droppableId];
    const colDestino = columnas[destination.droppableId];
    const tOrigen = [...colOrigen.tareas];
    const tDestino = [...colDestino.tareas];

    const [tareaMovida] = tOrigen.splice(source.index, 1);
    tareaMovida.Estado = destination.droppableId;
    tDestino.splice(destination.index, 0, tareaMovida);

    setColumnas({
      ...columnas,
      [source.droppableId]: { ...colOrigen, tareas: tOrigen },
      [destination.droppableId]: { ...colDestino, tareas: tDestino }
    });

    try {
      await axios.post('/api/comunicaciones/estado', { id: tareaMovida.id, Estado: destination.droppableId });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Cargando tablero UNMa...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Pañuelo Digital - UNMa</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {Object.values(columnas).map(col => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ background: '#f0f0f0', padding: '10px', width: '300px', minHeight: '500px', borderRadius: '8px' }}>
                  <h3>{col.titulo}</h3>
                  {col.tareas.map((t, index) => (
                    <Draggable draggableId={String(t.id)} index={index} key={t.id}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} style={{ background: '#fff', padding: '10px', margin: '0 0 10px 0', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                          <h4>{t.Asunto || "Sin Asunto"}</h4>
                          <p style={{ fontSize: '12px', color: '#555' }}>{t["Tipo de Comunicación"]}</p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;

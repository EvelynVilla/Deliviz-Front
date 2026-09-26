import { createContext, useContext, useMemo, useState } from 'react';
import * as api from '../api/cliente';

const Sesion = createContext(null);

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const valor = useMemo(() => ({
    sesion,
    entrar: async (correo, contrasena) => setSesion(await api.iniciarSesion(correo, contrasena)),
    salir: () => setSesion(null),
  }), [sesion]);
  return <Sesion.Provider value={valor}>{children}</Sesion.Provider>;
}

export const useSesion = () => useContext(Sesion);

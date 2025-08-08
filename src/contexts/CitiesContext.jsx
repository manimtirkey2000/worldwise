import { createContext, useEffect, useContext, useReducer } from "react";

const BASE_URL = "http://localhost:9000";
const CitiesContext = createContext();

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        isLoading: true,
      };
    case "city/loaded":
      return {
        ...state,
        currentCity: action.payload,
        isLoading: false,
      };
    case "cities/loaded":
      return {
        ...state,
        cities: action.payload,
        isLoading: false,
      };
    case "city/created":
      return {
        ...state,
        cities: [...state.cities, action.payload],
        isLoading: false,
        currentCity: action.payload,
      };
    case "city/deleted":
      return {
        ...state,
        cities: state.cities.filter((city) => city.id !== action.payload),
        isLoading: false,
        currentCity: {},
      };
    case "rejected":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity }, dispatch] = useReducer(
    reducer,
    initialState
  );
  // const [cities, setCities] = useState([]);
  // const [isLoading, setIsLoading] = useState(false);
  // const [currentCity, setCurrentCity] = useState({});
  useEffect(() => {
    async function fetchCities() {
      try {
        dispatch({ type: "loading" });
        const res = await fetch(`${BASE_URL}/cities`);

        if (!res.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await res.json();
        dispatch({
          type: "cities/loaded",
          payload: data,
        });
      } catch {
        dispatch({
          type: "rejected",
          payload: "Failed to fetch cities",
        });
      }
    }
    fetchCities();
  }, []);

  async function getCity(id) {
    if (Number(id) === currentCity.id) return;
    dispatch({ type: "loading" });
    try {
      const res = await fetch(`${BASE_URL}/cities/${id}`);

      if (!res.ok) {
        throw new Error("Failed to fetch city");
      }

      const data = await res.json();
      dispatch({
        type: "city/loaded",
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: "rejected",
        payload: error.message,
      });
    }
  }

  async function createCity(newCity) {
    dispatch({ type: "loading" });
    try {
      const res = await fetch(`${BASE_URL}/cities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCity),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch cities");
      }

      const data = await res.json();
      dispatch({
        type: "city/created",
        payload: data,
      });
    } catch {
      dispatch({
        type: "rejected",
        payload: "Failed to create city",
      });
    }
  }

  async function deleteCity(id) {
    dispatch({ type: "loading" });
    try {
      await fetch(`${BASE_URL}/cities/${id}`, {
        method: "DELETE",
      });

      dispatch({
        type: "city/deleted",
        payload: id,
      });
    } catch {
      dispatch({
        type: "rejected",
        payload: "Failed to delete city",
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined) {
    throw new Error("useCities must be used within a CitiesProvider");
  }
  return context;
}

export { CitiesProvider, useCities };

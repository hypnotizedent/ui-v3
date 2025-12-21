// Type declarations for Google Maps JavaScript API
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              types?: string[];
              componentRestrictions?: { country: string };
            }
          ) => {
            addListener: (event: string, handler: () => void) => void;
            getPlace: () => {
              address_components?: Array<{
                types: string[];
                long_name: string;
                short_name: string;
              }>;
            };
          };
        };
        event: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
  }
}

export {};

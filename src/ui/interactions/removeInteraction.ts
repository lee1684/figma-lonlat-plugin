import { Map } from "ol";

export const removeInteractions = (map: Map, interactionType: string) => {
  const interactionsToRemove = map.getInteractions().getArray().filter(interaction => {
    return interaction.constructor.name === interactionType;
  });
  interactionsToRemove.forEach(interaction => {
    map.removeInteraction(interaction);
  });
};

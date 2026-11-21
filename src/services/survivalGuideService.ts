import Fuse from 'fuse.js';
import protocolsData from '../data/survivalProtocols.json';
import { SurvivalProtocol } from '../types';

const typedProtocols = protocolsData as SurvivalProtocol[];

const fuseOptions = {
  includeScore: true,
  threshold: 0.35, // Balanced fuzzy tolerance for typo resistance in high-stress situations
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'tags', weight: 0.3 },
    { name: 'summary', weight: 0.2 },
    { name: 'criticalSteps', weight: 0.1 },
  ],
};

const fuseIndex = new Fuse(typedProtocols, fuseOptions);

export class SurvivalGuideService {
  /**
   * Performs an instant offline fuzzy search through disaster protocols.
   * Zero internet, zero remote fetch, instant UI response.
   */
  public static search(query: string): SurvivalProtocol[] {
    if (!query || query.trim().length === 0) {
      return typedProtocols;
    }

    const results = fuseIndex.search(query.trim());
    return results.map((result) => result.item);
  }

  /**
   * Returns all protocols filtered by category
   */
  public static getByCategory(category: string): SurvivalProtocol[] {
    if (!category || category === 'all') {
      return typedProtocols;
    }
    return typedProtocols.filter((p) => p.category === category);
  }

  /**
   * Retrieves single protocol by ID
   */
  public static getById(id: string): SurvivalProtocol | undefined {
    return typedProtocols.find((p) => p.id === id);
  }
}

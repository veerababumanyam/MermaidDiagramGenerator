/**
 * Timeline Diagram Plugin
 * Chronological event visualization with milestones and time periods
 */

import type {
  DiagramPlugin,
  DiagramRenderer,
  AIEnhancer,
  DiagramValidator,
  DiagramData,
  RenderConfig,
  RenderResult,
  Bounds,
  ValidationResult,
  AIAnalysis,
  AISuggestion,
  TimelineData,
  TimelineEvent,
  TimelineAxis,
  Position
} from '../../types/diagrams';

export class TimelineDiagramRenderer implements DiagramRenderer {
  private svgNS = 'http://www.w3.org/2000/svg';

  async render(data: DiagramData, config: RenderConfig): Promise<RenderResult> {
    const timelineData = data as TimelineData;
    const element = document.createElement('div');
    element.className = 'timeline-diagram-container';

    const svg = this.createSVGElement('svg', {
      width: config.width || 1200,
      height: config.height || 600,
      viewBox: '0 0 1200 600',
      class: 'timeline-diagram'
    });

    // Calculate timeline layout
    const layout = this.calculateTimelineLayout(timelineData, config);

    // Render timeline axis
    const axis = this.createTimelineAxis(timelineData.axis, layout, config);
    svg.appendChild(axis);

    // Render events
    timelineData.events.forEach(event => {
      const eventElement = this.createTimelineEvent(event, timelineData.axis, layout, config);
      svg.appendChild(eventElement);
    });

    element.appendChild(svg);

    const bounds = this.getBounds(timelineData, config);

    return {
      element,
      svg: svg.outerHTML,
      bounds,
      metadata: {
        renderTime: Date.now(),
        nodeCount: timelineData.events.length,
        edgeCount: 0,
        warnings: [],
        errors: []
      }
    };
  }

  async update(element: HTMLElement, data: DiagramData, config: RenderConfig): Promise<void> {
    element.innerHTML = '';
    const result = await this.render(data, config);
    element.appendChild(result.element);
  }

  destroy(element: HTMLElement): void {
    element.innerHTML = '';
  }

  getBounds(data: DiagramData, config: RenderConfig): Bounds {
    return {
      x: 0,
      y: 0,
      width: config.width || 1200,
      height: config.height || 600
    };
  }

  private calculateTimelineLayout(data: TimelineData, config: RenderConfig) {
    const totalWidth = config.width || 1200;
    const totalHeight = config.height || 600;

    const axisY = totalHeight * 0.6; // Axis positioned at 60% of height
    const leftMargin = 100;
    const rightMargin = 100;
    const axisWidth = totalWidth - leftMargin - rightMargin;

    const startTime = data.axis.startDate.getTime();
    const endTime = data.axis.endDate.getTime();
    const totalDuration = endTime - startTime;

    return {
      axisY,
      leftMargin,
      rightMargin,
      axisWidth,
      totalWidth,
      totalHeight,
      startTime,
      endTime,
      totalDuration,
      timeToX: (time: number) => leftMargin + ((time - startTime) / totalDuration) * axisWidth
    };
  }

  private createTimelineAxis(axis: TimelineAxis, layout: any, config: RenderConfig): SVGElement {
    const group = this.createSVGElement('g', { class: 'timeline-axis' });

    // Main timeline axis
    const axisLine = this.createSVGElement('line', {
      x1: layout.leftMargin.toString(),
      y1: layout.axisY.toString(),
      x2: (layout.totalWidth - layout.rightMargin).toString(),
      y2: layout.axisY.toString(),
      stroke: '#6c757d',
      'stroke-width': '3',
      class: 'timeline-axis-line'
    });
    group.appendChild(axisLine);

    // Timeline intervals and labels
    axis.intervals.forEach(interval => {
      const intervalX = layout.timeToX(interval.startDate.getTime());

      // Interval marker
      const marker = this.createSVGElement('line', {
        x1: intervalX.toString(),
        y1: (layout.axisY - 10).toString(),
        x2: intervalX.toString(),
        y2: (layout.axisY + 10).toString(),
        stroke: '#495057',
        'stroke-width': '2',
        class: 'timeline-interval-marker'
      });
      group.appendChild(marker);

      // Interval label
      const label = this.createSVGElement('text', {
        x: intervalX.toString(),
        y: (layout.axisY - 20).toString(),
        'text-anchor': 'middle',
        fill: '#495057',
        'font-size': '12',
        'font-weight': 'bold',
        class: 'timeline-interval-label'
      });
      label.textContent = interval.label;
      group.appendChild(label);
    });

    return group;
  }

  private createTimelineEvent(event: TimelineEvent, axis: TimelineAxis, layout: any, config: RenderConfig): SVGElement {
    const group = this.createSVGElement('g', { class: 'timeline-event' });

    const eventTime = event.date.getTime();
    const eventX = layout.timeToX(eventTime);
    const eventY = layout.axisY - 80; // Position above axis

    // Event line connecting to axis
    const connector = this.createSVGElement('line', {
      x1: eventX.toString(),
      y1: eventY.toString(),
      x2: eventX.toString(),
      y2: layout.axisY.toString(),
      stroke: this.getEventColor(event.category),
      'stroke-width': '2',
      'stroke-dasharray': '5,5',
      class: 'timeline-event-connector'
    });
    group.appendChild(connector);

    // Event node (circle or rectangle based on duration)
    let eventNode: SVGElement;
    if (event.duration && event.duration > 0) {
      // Rectangle for events with duration
      const durationWidth = (event.duration / layout.totalDuration) * layout.axisWidth;
      eventNode = this.createSVGElement('rect', {
        x: (eventX - durationWidth / 2).toString(),
        y: (eventY - 15).toString(),
        width: durationWidth.toString(),
        height: '30',
        fill: this.getEventColor(event.category),
        stroke: this.darkenColor(this.getEventColor(event.category), 0.3),
        'stroke-width': '2',
        rx: '5',
        class: 'timeline-event-duration'
      });
    } else {
      // Circle for point-in-time events
      eventNode = this.createSVGElement('circle', {
        cx: eventX.toString(),
        cy: eventY.toString(),
        r: '15',
        fill: this.getEventColor(event.category),
        stroke: this.darkenColor(this.getEventColor(event.category), 0.3),
        'stroke-width': '2',
        class: 'timeline-event-point'
      });
    }
    group.appendChild(eventNode);

    // Event title
    const title = this.createSVGElement('text', {
      x: eventX.toString(),
      y: (eventY - 25).toString(),
      'text-anchor': 'middle',
      fill: '#212529',
      'font-size': '14',
      'font-weight': 'bold',
      class: 'timeline-event-title'
    });
    title.textContent = event.title;
    group.appendChild(title);

    // Event description (if provided)
    if (event.description) {
      const description = this.createSVGElement('text', {
        x: eventX.toString(),
        y: (eventY + 45).toString(),
        'text-anchor': 'middle',
        fill: '#6c757d',
        'font-size': '11',
        class: 'timeline-event-description'
      });

      // Truncate long descriptions
      const maxLength = 50;
      const truncatedDesc = event.description.length > maxLength
        ? event.description.substring(0, maxLength) + '...'
        : event.description;

      description.textContent = truncatedDesc;
      group.appendChild(description);
    }

    // Add interactivity
    eventNode.addEventListener('mouseover', () => {
      eventNode.style.strokeWidth = '3';
      connector.style.strokeWidth = '3';
    });

    eventNode.addEventListener('mouseout', () => {
      eventNode.style.strokeWidth = '2';
      connector.style.strokeWidth = '2';
    });

    return group;
  }

  private getEventColor(category: string): string {
    const colorMap: Record<string, string> = {
      'milestone': '#28a745',
      'release': '#007bff',
      'incident': '#dc3545',
      'feature': '#ffc107',
      'meeting': '#6f42c1',
      'deadline': '#fd7e14',
      'default': '#6c757d'
    };

    return colorMap[category.toLowerCase()] || colorMap.default;
  }

  private darkenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  private createSVGElement(tagName: string, attributes: Record<string, string | number> = {}): SVGElement {
    const element = document.createElementNS(this.svgNS, tagName) as SVGElement;

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value.toString());
    });

    return element;
  }
}

export class TimelineDiagramValidator implements DiagramValidator {
  validate(data: DiagramData, type: string): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    const timelineData = data as TimelineData;

    // Validate axis
    if (!timelineData.axis) {
      errors.push({
        message: 'Timeline must have an axis configuration',
        severity: 'error'
      });
    } else {
      if (!timelineData.axis.startDate || !timelineData.axis.endDate) {
        errors.push({
          message: 'Timeline axis must have valid start and end dates',
          severity: 'error'
        });
      } else if (timelineData.axis.startDate >= timelineData.axis.endDate) {
        errors.push({
          message: 'Timeline axis end date must be after start date',
          severity: 'error'
        });
      }
    }

    // Validate events
    if (!timelineData.events || timelineData.events.length === 0) {
      errors.push({
        message: 'Timeline must have at least one event',
        severity: 'error'
      });
    } else {
      timelineData.events.forEach((event, index) => {
        if (!event.title) {
          errors.push({
            message: `Event at index ${index} must have a title`,
            severity: 'error'
          });
        }

        if (!event.date) {
          errors.push({
            message: `Event "${event.title || `at index ${index}`}" must have a valid date`,
            severity: 'error'
          });
        } else if (timelineData.axis) {
          const eventTime = event.date.getTime();
          const startTime = timelineData.axis.startDate.getTime();
          const endTime = timelineData.axis.endDate.getTime();

          if (eventTime < startTime || eventTime > endTime) {
            warnings.push({
              message: `Event "${event.title}" date is outside the timeline axis range`,
              severity: 'warning'
            });
          }
        }

        if (event.duration && event.duration < 0) {
          errors.push({
            message: `Event "${event.title}" duration must be non-negative`,
            severity: 'error'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getSchema(type: string): any {
    return {
      type: 'object',
      properties: {
        axis: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['linear', 'logarithmic'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' }
          },
          required: ['startDate', 'endDate']
        },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              duration: { type: 'number', minimum: 0 },
              category: { type: 'string' }
            },
            required: ['id', 'title', 'date', 'category']
          }
        }
      },
      required: ['axis', 'events']
    };
  }
}

export class TimelineDiagramAIEnhancer implements AIEnhancer {
  async analyze(data: DiagramData): Promise<AIAnalysis> {
    const timelineData = data as TimelineData;
    const eventCount = timelineData.events.length;
    const duration = timelineData.axis.endDate.getTime() - timelineData.axis.startDate.getTime();
    const durationYears = duration / (1000 * 60 * 60 * 24 * 365);

    let complexity = 0.3; // Base complexity
    if (eventCount > 20) complexity += 0.3;
    if (durationYears > 5) complexity += 0.2;
    if (timelineData.events.some(e => e.duration)) complexity += 0.1;

    const readability = eventCount <= 15 && durationYears <= 3 ? 0.9 : 0.7;
    const completeness = this.checkCompleteness(timelineData);

    const suggestions: AISuggestion[] = [];

    if (eventCount > 25) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        message: 'Consider breaking down large timelines into smaller, focused segments',
        confidence: 0.8,
        action: {
          type: 'optimize' as any,
          payload: { type: 'split' },
          description: 'Split timeline into segments'
        }
      });
    }

    // Check for event clustering
    const clusters = this.analyzeEventClusters(timelineData);
    if (clusters.some(cluster => cluster.count > 5)) {
      suggestions.push({
        type: 'layout',
        priority: 'medium',
        message: 'Some time periods have many events. Consider spreading them out or grouping related events',
        confidence: 0.7,
        action: {
          type: 'optimize' as any,
          payload: { type: 'spacing' },
          description: 'Improve event spacing'
        }
      });
    }

    // Check for missing categories
    const categories = new Set(timelineData.events.map(e => e.category));
    if (categories.size === 1 && eventCount > 3) {
      suggestions.push({
        type: 'content',
        priority: 'low',
        message: 'Consider using different categories to highlight different types of events',
        confidence: 0.5,
        action: {
          type: 'update' as any,
          payload: { type: 'categories' },
          description: 'Add event categories'
        }
      });
    }

    return {
      complexity,
      readability,
      completeness,
      suggestions,
      optimizations: []
    };
  }

  async optimize(data: DiagramData): Promise<DiagramData> {
    const timelineData = data as TimelineData;

    // Optimize event positioning to avoid overlaps
    const optimizedEvents = this.optimizeEventPositions(timelineData.events);

    return {
      ...timelineData,
      events: optimizedEvents
    };
  }

  async suggest(data: DiagramData): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const timelineData = data as TimelineData;

    // Suggest milestone identification
    const potentialMilestones = timelineData.events.filter(event =>
      event.category.toLowerCase().includes('release') ||
      event.category.toLowerCase().includes('launch') ||
      event.title.toLowerCase().includes('milestone')
    );

    if (potentialMilestones.length === 0 && timelineData.events.length > 5) {
      suggestions.push({
        type: 'content',
        priority: 'medium',
        message: 'Consider identifying key milestones or major events in your timeline',
        confidence: 0.6,
        action: {
          type: 'create' as any,
          payload: { type: 'milestones' },
          description: 'Add milestone markers'
        }
      });
    }

    // Suggest adding duration for events that span time
    const eventsWithoutDuration = timelineData.events.filter(event => !event.duration);
    if (eventsWithoutDuration.length > timelineData.events.length * 0.7) {
      suggestions.push({
        type: 'content',
        priority: 'low',
        message: 'Consider adding duration information for events that span multiple time periods',
        confidence: 0.4,
        action: {
          type: 'update' as any,
          payload: { type: 'durations' },
          description: 'Add event durations'
        }
      });
    }

    return suggestions;
  }

  async validate(data: DiagramData): Promise<ValidationResult> {
    const validator = new TimelineDiagramValidator();
    return validator.validate(data, 'timeline');
  }

  private checkCompleteness(data: TimelineData): number {
    let score = 0.5; // Base score

    if (data.axis && data.axis.startDate && data.axis.endDate) score += 0.2;
    if (data.events.length > 0) score += 0.2;
    if (data.events.some(e => e.description)) score += 0.1;

    // Check for event distribution
    const eventDistribution = this.analyzeEventDistribution(data);
    score += eventDistribution * 0.1;

    return Math.min(score, 1.0);
  }

  private analyzeEventClusters(data: TimelineData): Array<{ period: string, count: number }> {
    const clusters: Array<{ period: string, count: number }> = [];
    const totalDuration = data.axis.endDate.getTime() - data.axis.startDate.getTime();
    const segmentDuration = totalDuration / 10; // Divide into 10 segments

    for (let i = 0; i < 10; i++) {
      const segmentStart = data.axis.startDate.getTime() + i * segmentDuration;
      const segmentEnd = segmentStart + segmentDuration;

      const count = data.events.filter(event => {
        const eventTime = event.date.getTime();
        return eventTime >= segmentStart && eventTime < segmentEnd;
      }).length;

      clusters.push({
        period: `Segment ${i + 1}`,
        count
      });
    }

    return clusters;
  }

  private analyzeEventDistribution(data: TimelineData): number {
    const totalDuration = data.axis.endDate.getTime() - data.axis.startDate.getTime();
    const segmentDuration = totalDuration / 5; // Divide into 5 segments

    const segmentCounts = [];
    for (let i = 0; i < 5; i++) {
      const segmentStart = data.axis.startDate.getTime() + i * segmentDuration;
      const segmentEnd = segmentStart + segmentDuration;

      const count = data.events.filter(event => {
        const eventTime = event.date.getTime();
        return eventTime >= segmentStart && eventTime < segmentEnd;
      }).length;

      segmentCounts.push(count);
    }

    // Calculate distribution uniformity (1.0 = perfectly uniform, 0 = highly skewed)
    const avg = segmentCounts.reduce((a, b) => a + b, 0) / segmentCounts.length;
    const variance = segmentCounts.reduce((acc, count) => acc + Math.pow(count - avg, 2), 0) / segmentCounts.length;

    return Math.max(0, 1 - Math.sqrt(variance) / avg);
  }

  private optimizeEventPositions(events: TimelineEvent[]): TimelineEvent[] {
    // Simple optimization to prevent event overlap by adjusting Y positions
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

    return sortedEvents.map((event, index) => ({
      ...event,
      position: {
        x: 0, // Will be calculated by renderer
        y: (index % 3) * 60 // Stagger vertically to avoid overlap
      }
    }));
  }
}

// Export the complete Timeline diagram plugin
export const TimelineDiagramPlugin: DiagramPlugin = {
  id: 'timeline-diagram',
  name: 'Timeline Diagram',
  version: '1.0.0',
  type: 'timeline',
  description: 'Chronological event visualization with milestones and time periods',
  author: 'Mermaid Diagram Generator',
  renderer: new TimelineDiagramRenderer(),
  aiEnhancer: new TimelineDiagramAIEnhancer(),
  validator: new TimelineDiagramValidator(),
  config: {
    theme: 'default',
    responsive: true,
    interactive: true
  },
  supportedFormats: ['svg', 'png', 'pdf']
};

/**
 * Unit tests for Header component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  it('should render the application title', () => {
    render(<Header />);

    expect(screen.getByText('Mermaid Diagram Generator')).toBeInTheDocument();
  });

  it('should render the application description', () => {
    render(<Header />);

    expect(screen.getByText('Create professional diagrams from code with a real-time preview.')).toBeInTheDocument();
  });

  it('should render the logo icon', () => {
    render(<Header />);

    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-cyan-400');
  });

  it('should have proper styling classes', () => {
    const { container } = render(<Header />);

    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass(
      'bg-gray-800/50',
      'backdrop-blur-sm',
      'shadow-md',
      'p-4',
      'flex',
      'items-center',
      'space-x-4',
      'border-b',
      'border-gray-700'
    );
  });

  it('should have proper accessibility attributes', () => {
    render(<Header />);

    const title = screen.getByText('Mermaid Diagram Generator');
    expect(title).toHaveClass('text-xl', 'font-bold', 'text-white');
  });

  it('should render all required elements', () => {
    render(<Header />);

    // Check for main elements
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Mermaid Diagram Generator')).toBeInTheDocument();
    expect(screen.getByText('Create professional diagrams from code with a real-time preview.')).toBeInTheDocument();
  });
});


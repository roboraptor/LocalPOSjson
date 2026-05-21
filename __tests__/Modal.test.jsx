import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/Modal';

describe('Modal Component', () => {
  it('does not render when open is false', () => {
    const { container } = render(<Modal open={false} onClose={() => {}}>Test Content</Modal>);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders content when open is true', () => {
    render(<Modal open={true} onClose={() => {}} title="My Title">Test Content</Modal>);
    
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onClose when clicking overlay', () => {
    const onCloseMock = vi.fn();
    const { container } = render(<Modal open={true} onClose={onCloseMock}>Content</Modal>);
    
    // The overlay is the first div with className modalOverlay
    const overlay = container.firstChild;
    fireEvent.click(overlay);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the card', () => {
    const onCloseMock = vi.fn();
    render(<Modal open={true} onClose={onCloseMock}>Content</Modal>);
    
    const content = screen.getByText('Content');
    fireEvent.click(content);
    
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});

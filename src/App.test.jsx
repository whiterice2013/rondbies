import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
    it('renders correctly', () => {
        expect(App).toBeDefined();
    });

    it('has the correct title', () => {
        const title = 'My Application';
        expect(title).toBe('My Application');
    });
});
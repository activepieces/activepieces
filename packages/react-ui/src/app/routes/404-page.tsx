import { Button } from '@/components/ui/button';
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    return (
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
            <div className="mx-auto max-w-screen-sm text-center">
                <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary">404</h1>
                <p className="mb-4 text-3xl tracking-tight font-bold md:text-4xl text-muted-foreground">Something's missing.</p>
                <p className="mb-4 text-lg font-light text-muted-foreground">Sorry, we can't find that page. You'll find lots to explore on the home page. </p>
                <Link to="/flows">
                    <Button size="lg">
                        Back to Homepage
                    </Button>
                </Link>
            </div>
        </div>
    );
};


export default NotFoundPage;
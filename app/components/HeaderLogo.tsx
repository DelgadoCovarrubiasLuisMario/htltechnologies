'use client';

import Image from 'next/image';

export default function HeaderLogo() {
  return (
    <>
      {/* Desktop: Logo arriba a la derecha */}
      <div className="header-logo-desktop">
        <div className="header-logo-block">
          <Image 
            src="/logo.jpg" 
            alt="HTL Electronics" 
            width={90} 
            height={60}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <div className="header-slogan-block">
          <p className="header-slogan-desktop">
            Be the best<br />Be HTL
          </p>
        </div>
      </div>

      {/* Mobile: Logo centrado arriba */}
      <div className="header-logo-mobile">
        <div className="header-logo-block-mobile">
          <Image 
            src="/logo.jpg" 
            alt="HTL Electronics" 
            width={90} 
            height={60}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <div className="header-slogan-block-mobile">
          <p className="header-slogan-mobile">
            be the best<br />be HTL
          </p>
        </div>
      </div>
    </>
  );
}


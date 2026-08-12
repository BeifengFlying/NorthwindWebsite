import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@chakra-ui/react';
import { RiVolumeDownFill, RiVolumeUpFill } from 'react-icons/ri';

import './ElasticSlider.css';

const MAX_OVERFLOW = 50;

export default function ElasticSlider({
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = <Icon as={RiVolumeDownFill} />,
  rightIcon = <Icon as={RiVolumeUpFill} />,
  onChange,
  valueFormatter = value => Math.round(value)
}) {
  return (
    <div className={`slider-container ${className}`}>
      <Slider
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onChange={onChange}
        valueFormatter={valueFormatter}
      />
    </div>
  );
}

function Slider({ defaultValue, startingValue, maxValue, isStepped, stepSize, leftIcon, rightIcon, onChange, valueFormatter }) {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef(null);
  const [region, setRegion] = useState('middle');
  const regionRef = useRef('middle');
  const rectRef = useRef(null);
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useMotionValueEvent(clientX, 'change', latest => {
    const rect = rectRef.current;
    if (rect) {
      const { left, right } = rect;
      let newValue;

      if (latest < left) {
        if (regionRef.current !== 'left') { regionRef.current = 'left'; setRegion('left'); }
        newValue = left - latest;
      } else if (latest > right) {
        if (regionRef.current !== 'right') { regionRef.current = 'right'; setRegion('right'); }
        newValue = latest - right;
      } else {
        if (regionRef.current !== 'middle') { regionRef.current = 'middle'; setRegion('middle'); }
        newValue = 0;
      }

      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = e => {
    if (e.buttons > 0 && sliderRef.current) {
      const rect = rectRef.current || sliderRef.current.getBoundingClientRect();
      rectRef.current = rect;
      const { left, width } = rect;
      let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);

      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }

      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      setValue(newValue);
      if (onChange) onChange(newValue);
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = e => {
    rectRef.current = sliderRef.current?.getBoundingClientRect() || null;
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    const release = animate(overflow, 0, { type: 'spring', bounce: 0.5 });
    release.then(() => { rectRef.current = null; });
  };

  const handleKeyDown = e => {
    const delta = e.key === 'ArrowLeft' || e.key === 'ArrowDown'
      ? -stepSize
      : e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? stepSize
        : 0;
    if (!delta) return;
    e.preventDefault();
    const nextValue = Math.min(Math.max(value + delta, startingValue), maxValue);
    setValue(nextValue);
    if (onChange) onChange(nextValue);
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;

    return ((value - startingValue) / totalRange) * 100;
  };

  return (
    <>
      <motion.div
        onHoverStart={() => animate(scale, 1.2)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.2)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.2], [0.7, 1])
        }}
        className="slider-wrapper"
      >
        <motion.div
          animate={{
            scale: region === 'left' ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'left' ? -overflow.get() / scale.get() : 0))
          }}
        >
          {leftIcon}
        </motion.div>

        <div
          ref={sliderRef}
          className="slider-root"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
          onKeyDown={handleKeyDown}
          role="slider"
          aria-valuemin={startingValue}
          aria-valuemax={maxValue}
          aria-valuenow={value}
          tabIndex={0}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (rectRef.current) {
                  const { width } = rectRef.current;
                  return 1 + overflow.get() / width;
                }
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (rectRef.current) {
                  const { left, width } = rectRef.current;
                  return clientX.get() < left + width / 2 ? 'right' : 'left';
                }
              }),
              height: useTransform(scale, [1, 1.2], [6, 12]),
              marginTop: useTransform(scale, [1, 1.2], [0, -3]),
              marginBottom: useTransform(scale, [1, 1.2], [0, -3])
            }}
            className="slider-track-wrapper"
          >
            <div className="slider-track">
              <div className="slider-range" style={{ width: `${getRangePercentage()}%` }} />
            </div>
          </motion.div>
        </div>

        <motion.div
          animate={{
            scale: region === 'right' ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'right' ? overflow.get() / scale.get() : 0))
          }}
        >
          {rightIcon}
        </motion.div>
      </motion.div>
      <p className="value-indicator">{valueFormatter(Math.round(value))}</p>
    </>
  );
}

function decay(value, max) {
  if (max === 0) {
    return 0;
  }

  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);

  return sigmoid * max;
}
